import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { parseMissionInput, readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { createMission } from '$lib/server/services/missions';

export const POST: RequestHandler = (event) =>
	respond(async () => createMission(getDb(), currentUserId(), parseMissionInput(await readBody(event)), today()));
