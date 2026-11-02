import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { intParam, parseMissionPatch, readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { deleteMission, updateMission } from '$lib/server/services/missions';

export const PATCH: RequestHandler = (event) =>
	respond(async () =>
		updateMission(
			getDb(),
			currentUserId(),
			intParam(event.params.id, 'id'),
			parseMissionPatch(await readBody(event)),
			today()
		)
	);

export const DELETE: RequestHandler = (event) =>
	respond(() => deleteMission(getDb(), currentUserId(), intParam(event.params.id, 'id')));
