import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { GRADES } from '$lib/rules';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { progress, xpHistory } from '$lib/server/services/xp';

export const GET: RequestHandler = () =>
	respond(() => {
		const userId = currentUserId();
		return { ...progress(getDb(), userId), grades: GRADES, history: xpHistory(getDb(), userId, today()) };
	});
