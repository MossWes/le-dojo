import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { intParam, readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { ValidationError } from '$lib/server/services/errors';
import { setQuestDay } from '$lib/server/services/quests';

export const PUT: RequestHandler = (event) =>
	respond(async () => {
		const body = await readBody(event);
		if (body.status !== 'held' && body.status !== 'slip')
			throw new ValidationError('status', 'Statut attendu : held ou slip.');
		const note = typeof body.note === 'string' ? body.note : null;
		setQuestDay(getDb(), currentUserId(), intParam(event.params.id, 'id'), event.params.day, body.status, note, today());
		return { ok: true };
	});
