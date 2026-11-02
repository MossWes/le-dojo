import type { Day } from '../../dates';
import { XP_BY_RITUAL } from '../../rules';
import type { Db } from '../db/client';
import { oathLogs, xpEvents, type Ritual } from '../db/schema';

/** Records a daily ritual. Returns true if XP was granted, false if already done today. */
export function recordRitual(db: Db, userId: number, ritual: Ritual, day: Day): boolean {
	const result = db
		.insert(xpEvents)
		.values({ userId, day, kind: 'ritual', ritual, amount: XP_BY_RITUAL[ritual] })
		.onConflictDoNothing()
		.run();
	return result.changes > 0;
}

/** "Je l'ai dit": logs the oath of the day and validates the ritual. */
export function recordOath(db: Db, userId: number, day: Day): boolean {
	return db.transaction(() => {
		db.insert(oathLogs).values({ userId, day }).onConflictDoNothing().run();
		return recordRitual(db, userId, 'oath', day);
	});
}
