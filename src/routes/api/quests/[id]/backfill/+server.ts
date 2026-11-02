import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { intParam, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { backfillQuest } from '$lib/server/services/quests';

export const POST: RequestHandler = (event) =>
	respond(() => ({ filled: backfillQuest(getDb(), currentUserId(), intParam(event.params.id, 'id'), today()) }));
