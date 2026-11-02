import { and, eq, isNull } from 'drizzle-orm';
import { addDays, dayRange, isDay, nowIso, type Day } from '../../dates';
import { milestoneOn, questDayNumber, questEndDay } from '../../rules';
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
	status: 'held' | 'slip',
	note: string | null
): void {
	tx.insert(questLogs)
		.values({ userId: quest.userId, questId: quest.id, day, status, note })
		.onConflictDoUpdate({ target: [questLogs.questId, questLogs.day], set: { status, note } })
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
		// A slip earns nothing; it only cancels the "held" XP of that same day if it was set by mistake.
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
