// Everything the "Aujourd'hui" screen needs, in one call (GET /api/today).
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { dayOfIso, formatDayLong, formatDayShort, timeOfDay, today, type Day } from '../dates';
import { compareRanks } from '../rules';
import type { Db } from './db/client';
import { fronts, missions, questLogs, quests, users, xpEvents, type Ritual, type UserSettings } from './db/schema';
import { DEFAULT_SETTINGS } from './seed';
import { NotFoundError } from './services/errors';
import type { Mission } from './services/missions';
import { questState } from './services/quests';
import { readingOfDay } from './services/readings';
import { progress } from './services/xp';

export type TodayMission = {
	id: number;
	title: string;
	rank: Mission['rank'];
	status: Mission['status'];
	done: boolean;
	front: string | null;
	dueDate: Day | null;
	dueLabel: string | null;
	overdue: boolean;
	testReview: boolean;
};

export function userSettings(db: Db, userId: number): UserSettings {
	const user = db.select({ settings: users.settings }).from(users).where(eq(users.id, userId)).get();
	if (!user) throw new NotFoundError('Compte');
	return { ...DEFAULT_SETTINGS, ...user.settings };
}

export function buildToday(db: Db, userId: number, now: Date = new Date()) {
	const day = today(now);
	const time = timeOfDay(now);
	const settings = userSettings(db, userId);

	const frontNames = new Map(
		db.select({ id: fronts.id, name: fronts.name }).from(fronts).where(eq(fronts.userId, userId)).all().map((f) => [f.id, f.name])
	);
	const all = db.select().from(missions).where(eq(missions.userId, userId)).all();

	const toView = (m: Mission): TodayMission => ({
		id: m.id,
		title: m.title,
		rank: m.rank,
		status: m.status,
		done: m.status === 'done',
		front: m.frontId ? (frontNames.get(m.frontId) ?? null) : null,
		dueDate: m.dueDate,
		dueLabel: m.dueDate ? formatDayShort(m.dueDate) : null,
		overdue: !!m.dueDate && m.dueDate < day && m.status !== 'done',
		testReview: m.isTest && m.reviewDate === day
	});

	const active = (m: Mission) => m.status === 'todo' || m.status === 'doing';
	const sMission = all.find((m) => m.rank === 'S' && active(m)) ?? null;
	const ofDay = all
		.filter(
			(m) =>
				(active(m) &&
					((m.plannedDate !== null && m.plannedDate <= day) ||
						m.dueDate === day ||
						(m.isTest && m.reviewDate !== null && m.reviewDate <= day))) ||
				(m.status === 'done' && m.doneAt !== null && dayOfIso(m.doneAt) === day)
		)
		.sort(
			(a, b) =>
				compareRanks(a.rank, b.rank) ||
				(a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
				a.id - b.id
		)
		.map(toView);

	const activeQuests = db
		.select()
		.from(quests)
		.where(and(eq(quests.userId, userId), eq(quests.status, 'active')))
		.all();
	const logs = activeQuests.length
		? db.select().from(questLogs).where(inArray(questLogs.questId, activeQuests.map((q) => q.id))).all()
		: [];
	const questViews = activeQuests
		.filter((q) => q.startDate <= day)
		.map((q) => {
			const qLogs = logs.filter((l) => l.questId === q.id);
			const state = questState(q, qLogs, day);
			const todayLog = qLogs.find((l) => l.day === day) ?? null;
			return {
				id: q.id,
				title: q.title,
				lengthDays: q.lengthDays,
				dayNumber: state.dayNumber,
				isOver: state.isOver,
				missingDays: state.missingDays.length,
				todayStatus: todayLog?.status ?? null,
				todayNote: todayLog?.note ?? null
			};
		})
		.filter((q) => !q.isOver);

	const ritualRows = db
		.select({ ritual: xpEvents.ritual })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), eq(xpEvents.kind, 'ritual'), eq(xpEvents.day, day), isNull(xpEvents.revokedAt)))
		.all();
	const done = new Set(ritualRows.map((r) => r.ritual));
	const rituals = Object.fromEntries(
		(['reading', 'oath', 'evening_review'] as const).map((r) => [r, done.has(r)])
	) as Record<Ritual, boolean>;

	const reading = readingOfDay(db, userId, day);
	const morningUntil = settings.ritual_morning_until ?? '08:00';

	return {
		day,
		dayLabel: formatDayLong(day),
		time,
		progress: progress(db, userId),
		sMission: sMission ? toView(sMission) : null,
		reading,
		missions: ofDay,
		quests: questViews,
		rituals,
		isEvening: time >= settings.ritual_evening_start,
		showMorning:
			settings.ritual_morning_mode === 'mantra_only' &&
			time >= settings.ritual_morning_time &&
			time < morningUntil &&
			!!reading,
		voice: { name: settings.voice_name, rate: settings.voice_rate }
	};
}

export type TodayData = ReturnType<typeof buildToday>;
