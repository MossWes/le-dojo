import serment from '../../../../seed/serment.json';
import { today } from '$lib/dates';
import { GRADES } from '$lib/rules';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { progress, xpHistory } from '$lib/server/services/xp';
import { userSettings } from '$lib/server/today';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const userId = currentUserId();
	return {
		progress: progress(db, userId),
		grades: GRADES,
		history: xpHistory(db, userId, today()),
		way: serment.voie,
		redLines: serment.red_lines,
		settings: userSettings(db, userId)
	};
};
