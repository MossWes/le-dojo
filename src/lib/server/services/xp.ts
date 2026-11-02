import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { addDays, dayRange } from '../../dates';
import { gradeFor } from '../../rules';
import type { Db } from '../db/client';
import { xpEvents } from '../db/schema';

// XP is never stored as a counter: it is always the sum of the active events.
export function totalXp(db: Db, userId: number): number {
	const row = db
		.select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), isNull(xpEvents.revokedAt)))
		.get();
	return row?.total ?? 0;
}

export function progress(db: Db, userId: number) {
	const xp = totalXp(db, userId);
	return { xp, ...gradeFor(xp) };
}

/** XP earned per day over the last `days` days (oldest first, every day present). */
export function xpHistory(db: Db, userId: number, today: string, days = 30): { day: string; xp: number }[] {
	const from = addDays(today, -(days - 1));
	const rows = db
		.select({ day: xpEvents.day, xp: sql<number>`sum(${xpEvents.amount})` })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), isNull(xpEvents.revokedAt), gte(xpEvents.day, from), lte(xpEvents.day, today)))
		.groupBy(xpEvents.day)
		.all();
	const byDay = new Map(rows.map((r) => [r.day, r.xp]));
	return dayRange(from, today).map((day) => ({ day, xp: byDay.get(day) ?? 0 }));
}
