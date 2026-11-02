import { and, eq, isNull, sql } from 'drizzle-orm';
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
