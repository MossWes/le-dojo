import type { Day } from '../../dates';
import { XP_BY_RITUAL } from '../../rules';
import type { Db } from '../db/client';
import { xpEvents, type Ritual } from '../db/schema';

/** Records a daily ritual. Returns true if XP was granted, false if already done today. */
export function recordRitual(db: Db, userId: number, ritual: Ritual, day: Day): boolean {
	const result = db
		.insert(xpEvents)
		.values({ userId, day, kind: 'ritual', ritual, amount: XP_BY_RITUAL[ritual] })
		.onConflictDoNothing()
		.run();
	return result.changes > 0;
}
