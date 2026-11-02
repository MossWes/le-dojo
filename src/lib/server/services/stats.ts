// V2 — statistics: regularity, missions by front, XP curve. Always computed from the journal.
import { and, asc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { addDays, dayOfIso, dayRange, type Day } from '../../dates';
import type { Db } from '../db/client';
import { fronts, missions, questLogs, quests, xpEvents } from '../db/schema';

export function statistics(db: Db, userId: number, today: Day, days = 30) {
	const from = addDays(today, -(days - 1));
	const range = dayRange(from, today);

	// Regularity: rituals done each day, and days held in daily quests.
	const ritualRows = db
		.select({ day: xpEvents.day, n: sql<number>`count(*)` })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), eq(xpEvents.kind, 'ritual'), isNull(xpEvents.revokedAt), gte(xpEvents.day, from), lte(xpEvents.day, today)))
		.groupBy(xpEvents.day)
		.all();
	const ritualsByDay = new Map(ritualRows.map((r) => [r.day, r.n]));
	const heldRows = db
		.select({ day: questLogs.day })
		.from(questLogs)
		.innerJoin(quests, eq(quests.id, questLogs.questId))
		.where(and(eq(questLogs.userId, userId), eq(quests.kind, 'daily_hold'), eq(questLogs.status, 'held'), gte(questLogs.day, from), lte(questLogs.day, today)))
		.all();
	const held = new Set(heldRows.map((r) => r.day));
	const regularity = range.map((day) => ({ day, rituals: ritualsByDay.get(day) ?? 0, held: held.has(day) }));
	const daysWithRitual = regularity.filter((d) => d.rituals > 0).length;
	const ritualRate = regularity.reduce((a, d) => a + d.rituals, 0) / (days * 3);

	// Missions by front (done / open), fronts without missions left out.
	const all = db.select().from(missions).where(eq(missions.userId, userId)).all();
	const frontList = db.select().from(fronts).where(eq(fronts.userId, userId)).orderBy(asc(fronts.sortOrder)).all();
	const byFront = [...frontList.map((f) => ({ id: f.id as number | null, name: f.name })), { id: null, name: 'Sans front' }]
		.map((f) => {
			const mine = all.filter((m) => m.frontId === f.id);
			return {
				name: f.name,
				done: mine.filter((m) => m.status === 'done').length,
				open: mine.filter((m) => m.status === 'todo' || m.status === 'doing').length
			};
		})
		.filter((f) => f.done + f.open > 0);

	// XP curve: cumulative total at the end of each day, from the first event.
	const perDay = db
		.select({ day: xpEvents.day, xp: sql<number>`sum(${xpEvents.amount})` })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), isNull(xpEvents.revokedAt)))
		.groupBy(xpEvents.day)
		.orderBy(asc(xpEvents.day))
		.all();
	const first = perDay[0]?.day ?? today;
	const xpMap = new Map(perDay.map((r) => [r.day, r.xp]));
	let running = 0;
	const curve = dayRange(first < today ? first : today, today).map((day) => {
		running += xpMap.get(day) ?? 0;
		return { day, total: running };
	});

	const doneThisPeriod = all.filter((m) => m.status === 'done' && m.doneAt && dayOfIso(m.doneAt) >= from).length;

	return { from, days, regularity, daysWithRitual, ritualRate, byFront, curve, doneThisPeriod };
}
