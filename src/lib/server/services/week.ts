// V2 — Sunday review: what I did this week, the XP earned, what slipped, and next week's plan.
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { addDays, dayOfIso, formatDayLong, weekStart, type Day } from '../../dates';
import { RANK_ORDER } from '../../rules';
import type { Db } from '../db/client';
import { fronts, missions, xpEvents } from '../db/schema';
import { missionView } from '../mission-view';
import { updateMission } from './missions';

export function weeklyReview(db: Db, userId: number, today: Day) {
	const start = weekStart(today);
	const end = addDays(start, 6);
	const nextMonday = addDays(start, 7);
	const frontNames = new Map(
		db.select({ id: fronts.id, name: fronts.name }).from(fronts).where(eq(fronts.userId, userId)).all().map((f) => [f.id, f.name])
	);
	const all = db.select().from(missions).where(eq(missions.userId, userId)).all();
	const byRank = (a: { rank: string }, b: { rank: string }) =>
		RANK_ORDER.indexOf(a.rank as never) - RANK_ORDER.indexOf(b.rank as never);

	const done = all
		.filter((m) => m.status === 'done' && m.doneAt && dayOfIso(m.doneAt) >= start && dayOfIso(m.doneAt) <= end)
		.sort(byRank);
	const active = all.filter((m) => m.status === 'todo' || m.status === 'doing');
	// Slipped: still open although their due or planned day is already behind me.
	const slipped = active
		.filter((m) => (m.dueDate !== null && m.dueDate < today) || (m.plannedDate !== null && m.plannedDate < today))
		.sort(byRank);

	const xpRows = db
		.select({ kind: xpEvents.kind, total: sql<number>`sum(${xpEvents.amount})` })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), isNull(xpEvents.revokedAt), gte(xpEvents.day, start), lte(xpEvents.day, end)))
		.groupBy(xpEvents.kind)
		.all();
	const xpByKind = Object.fromEntries(xpRows.map((r) => [r.kind, r.total]));
	const xp = xpRows.reduce((a, r) => a + r.total, 0);

	return {
		start,
		end,
		startLabel: formatDayLong(start),
		endLabel: formatDayLong(end),
		nextMonday,
		nextMondayLabel: formatDayLong(nextMonday),
		xp,
		xpByKind,
		done: done.map((m) => missionView(m, today, frontNames)),
		slipped: slipped.map((m) => missionView(m, today, frontNames)),
		candidates: active.sort(byRank).map((m) => ({
			...missionView(m, today, frontNames),
			plannedNextWeek: m.plannedDate !== null && m.plannedDate >= nextMonday && m.plannedDate <= addDays(nextMonday, 6)
		}))
	};
}

/** Plans the chosen missions for a day of next week (Monday by default). */
export function planWeek(db: Db, userId: number, ids: number[], day: Day, today: Day): number {
	for (const id of ids) updateMission(db, userId, id, { plannedDate: day }, today);
	return ids.length;
}
