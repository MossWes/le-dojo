import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { intParam, readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { markReadingSeen } from '$lib/server/services/readings';

export const POST: RequestHandler = (event) =>
	respond(async () => {
		const body = await readBody(event);
		return markReadingSeen(getDb(), currentUserId(), intParam(event.params.id, 'id'), today(), body.listened === true);
	});
