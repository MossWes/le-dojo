import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { intParam, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { readingToMission } from '$lib/server/services/readings';

export const POST: RequestHandler = (event) =>
	respond(() => readingToMission(getDb(), currentUserId(), intParam(event.params.id, 'id'), today()));
