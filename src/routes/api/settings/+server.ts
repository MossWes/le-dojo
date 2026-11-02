import type { RequestHandler } from './$types';
import { readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { updateSettings } from '$lib/server/services/settings';
import { userSettings } from '$lib/server/today';

export const GET: RequestHandler = () => respond(() => userSettings(getDb(), currentUserId()));
export const PATCH: RequestHandler = (event) =>
	respond(async () => updateSettings(getDb(), currentUserId(), await readBody(event)));
