import type { RequestHandler } from './$types';
import { addDays, isDay, today, weekStart } from '$lib/dates';
import { readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { ValidationError } from '$lib/server/services/errors';
import { planWeek, weeklyReview } from '$lib/server/services/week';

export const GET: RequestHandler = () => respond(() => weeklyReview(getDb(), currentUserId(), today()));

/** body: { missionIds: number[], day: 'YYYY-MM-DD' } — day must be in the coming week. */
export const POST: RequestHandler = (event) =>
	respond(async () => {
		const body = await readBody(event);
		const now = today();
		const monday = addDays(weekStart(now), 7);
		const day = typeof body.day === 'string' ? body.day : monday;
		if (!isDay(day) || day < now || day > addDays(monday, 6))
			throw new ValidationError('day', 'Je choisis un jour de la semaine qui vient.');
		const ids = Array.isArray(body.missionIds) ? body.missionIds.filter((n): n is number => Number.isInteger(n)) : [];
		return { planned: planWeek(getDb(), currentUserId(), ids, day, now) };
	});
