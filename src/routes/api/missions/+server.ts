import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { parseMissionFilters, parseMissionInput, readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { createMission, listMissions } from '$lib/server/services/missions';

export const POST: RequestHandler = (event) =>
	respond(async () => createMission(getDb(), currentUserId(), parseMissionInput(await readBody(event)), today()));

export const GET: RequestHandler = (event) =>
	respond(() => listMissions(getDb(), currentUserId(), parseMissionFilters(event.url.searchParams)));
