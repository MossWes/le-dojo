import { and, eq, isNull } from 'drizzle-orm';
import { addDays, dayRange, isDay, nowIso, type Day } from '../../dates';
import { milestoneOn, QUEST_DEFAULTS, questDayNumber, questEndDay } from '../../rules';
import type { Db } from '../db/client';
import { questLogs, quests, xpEvents } from '../db/schema';
import { NotFoundError, ValidationError } from './errors';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type Quest = typeof quests.$inferSelect;
export type QuestLog = typeof questLogs.$inferSelect;

export type QuestState = {
	dayNumber: number;
	endDay: Day | null;
	/** Today is past the last day. */
	isOver: boolean;
	held: number;
	slips: number;
	/** Past days (up to yesterday, within the quest) that have no log yet. */
	missingDays: Day[];
	milestones: { day: number; xp: number; reached: boolean }[];
};

export function questState(quest: Quest, logs: readonly QuestLog[], today: Day): QuestState {
	const endDay = questEndDay(quest.startDate, quest.lengthDays);
	const logged = new Set(logs.map((l) => l.day));
	const yesterday = addDays(today, -1);
	const lastPast = endDay && endDay < yesterday ? endDay : yesterday;
	return {
		dayNumber: questDayNumber(quest.startDate, today),
		endDay,
		isOver: endDay !== null && today > endDay,
		held: logs.filter((l) => l.status === 'held').length,
		slips: logs.filter((l) => l.status === 'slip').length,
		missingDays: dayRange(quest.startDate, lastPast).filter((d) => !logged.has(d)),
		milestones: quest.milestones.map((m) => ({
			...m,
			reached: logs.some((l) => questDayNumber(quest.startDate, l.day) === m.day)
		}))
	};
}

function loadQuest(tx: Tx, userId: number, questId: number): Quest {
	const quest = tx
		.select()
		.from(quests)
		.where(and(eq(quests.id, questId), eq(quests.userId, userId)))
		.get();
	if (!quest) throw new NotFoundError('Quête');
	return quest;
}

function writeDay(
	tx: Tx,
	quest: Quest,
	day: Day,
	status: 'held' | 'slip' | 'logged',
	note: string | null,
	value: number | null = null
): void {
	tx.insert(questLogs)
		.values({ userId: quest.userId, questId: quest.id, day, status, note, value })
		.onConflictDoUpdate({ target: [questLogs.questId, questLogs.day], set: { status, note, value } })
		.run();

	const dayEvent = and(
		eq(xpEvents.userId, quest.userId),
		eq(xpEvents.kind, 'quest_day'),
		eq(xpEvents.refType, 'quest'),
		eq(xpEvents.refId, quest.id),
		eq(xpEvents.day, day),
		isNull(xpEvents.revokedAt)
	);
	if (status === 'held') {
		tx.insert(xpEvents)
			.values({
				userId: quest.userId,
				day,
				kind: 'quest_day',
				refType: 'quest',
				refId: quest.id,
				amount: quest.xpPerDay
			})
			.onConflictDoNothing()
			.run();
	} else {
		// A slip (or steps under the goal) earns nothing; it only cancels the "held" XP of that same day.
		tx.update(xpEvents).set({ revokedAt: nowIso() }).where(dayEvent).run();
	}

	// Milestones reward showing up over time: paid once, as soon as their day is logged.
	const milestone = milestoneOn(quest.milestones, questDayNumber(quest.startDate, day));
	if (milestone) {
		tx.insert(xpEvents)
			.values({
				userId: quest.userId,
				day,
				kind: 'quest_milestone',
				refType: 'quest',
				refId: quest.id,
				amount: milestone.xp
			})
			.onConflictDoNothing()
			.run();
	}
}

export function setQuestDay(
	db: Db,
	userId: number,
	questId: number,
	day: Day,
	status: 'held' | 'slip',
	note: string | null,
	today: Day
): void {
	if (!isDay(day)) throw new ValidationError('day', 'Date invalide.');
	if (status !== 'held' && status !== 'slip') throw new ValidationError('status', 'Statut inconnu.');
	db.transaction((tx) => {
		const quest = loadQuest(tx, userId, questId);
		const endDay = questEndDay(quest.startDate, quest.lengthDays);
		if (day < quest.startDate || day > today || (endDay !== null && day > endDay))
			throw new ValidationError('day', 'Ce jour ne fait pas partie de la quête.');
		writeDay(tx, quest, day, status, note?.trim() || null);
	});
}

/** Marks every past day without a log as held. Returns how many days were filled. */
export function backfillQuest(db: Db, userId: number, questId: number, today: Day): number {
	return db.transaction((tx) => {
		const quest = loadQuest(tx, userId, questId);
		const logs = tx.select().from(questLogs).where(eq(questLogs.questId, questId)).all();
		const { missingDays } = questState(quest, logs, today);
		for (const day of missingDays) writeDay(tx, quest, day, 'held', null);
		return missingDays.length;
	});
}

export type QuestCalendarDay = {
	day: Day;
	number: number;
	status: 'held' | 'slip' | 'logged' | null;
	note: string | null;
	value: number | null;
	isFuture: boolean;
	isToday: boolean;
};

export type QuestOverview = Quest & {
	state: QuestState;
	calendar: QuestCalendarDay[];
	finished: boolean;
};

/** Every quest with its state and a day-by-day calendar (shown up to today for endless quests). */
export function questOverviews(db: Db, userId: number, today: Day): QuestOverview[] {
	const all = db.select().from(quests).where(eq(quests.userId, userId)).all();
	return all.map((q) => {
		const logs = db.select().from(questLogs).where(eq(questLogs.questId, q.id)).all();
		const byDay = new Map(logs.map((l) => [l.day, l]));
		const state = questState(q, logs, today);
		const last = state.endDay ?? (today > q.startDate ? today : q.startDate);
		const calendar = dayRange(q.startDate, last).map((d, i) => {
			const log = byDay.get(d);
			return {
				day: d,
				number: i + 1,
				status: log?.status ?? null,
				note: log?.note ?? null,
				value: log?.value ?? null,
				isFuture: d > today,
				isToday: d === today
			};
		});
		return { ...q, state, calendar, finished: state.isOver || q.status !== 'active' };
	});
}

export const STEPS_QUEST_SLUG = 'pas-quotidiens';

/** The "daily steps" quest, created the first time steps arrive. */
export function ensureStepsQuest(db: Db, userId: number, day: Day): Quest {
	const existing = db
		.select()
		.from(quests)
		.where(and(eq(quests.userId, userId), eq(quests.slug, STEPS_QUEST_SLUG)))
		.get();
	if (existing) return existing;
	return db
		.insert(quests)
		.values({
			userId,
			slug: STEPS_QUEST_SLUG,
			title: 'Mes pas quotidiens',
			kind: 'daily_steps',
			startDate: day,
			lengthDays: null,
			milestones: QUEST_DEFAULTS.milestones,
			xpPerDay: QUEST_DEFAULTS.xp_per_day
		})
		.returning()
		.get();
}

/** Steps sent by the shortcut: "held" if the goal is reached, otherwise "logged" (no XP, no reproach). */
export function logSteps(
	db: Db,
	userId: number,
	day: Day,
	steps: number,
	goal: number,
	today: Day
): { dayNumber: number; status: 'held' | 'logged' } {
	if (!isDay(day) || day > today || day < addDays(today, -7))
		throw new ValidationError('date', 'Date attendue : aujourd’hui ou l’un des 7 derniers jours (AAAA-MM-JJ).');
	if (!Number.isInteger(steps) || steps < 0 || steps > 200_000)
		throw new ValidationError('steps', 'Nombre de pas invalide.');
	return db.transaction((tx) => {
		const quest = ensureStepsQuest(db, userId, day < today ? day : today);
		const status = steps >= goal ? 'held' : 'logged';
		writeDay(tx, quest, day, status, null, steps);
		return { dayNumber: questDayNumber(quest.startDate, day), status };
	});
}
