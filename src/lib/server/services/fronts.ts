import { asc, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { fronts } from '../db/schema';

export type Front = typeof fronts.$inferSelect;

/** Active fronts first, then those in reserve. */
export function listFronts(db: Db, userId: number): Front[] {
	return db
		.select()
		.from(fronts)
		.where(eq(fronts.userId, userId))
		.orderBy(asc(fronts.sortOrder), asc(fronts.id))
		.all()
		.sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
}
