import type { RequestHandler } from './$types';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { sendToUser, testMessage } from '$lib/server/push';

export const POST: RequestHandler = () =>
	respond(async () => ({ sent: await sendToUser(getDb(), currentUserId(), testMessage()) }));
