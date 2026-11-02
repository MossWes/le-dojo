import type { RequestHandler } from './$types';
import { readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { removeSubscription, saveSubscription } from '$lib/server/push';
import { ValidationError } from '$lib/server/services/errors';

function parse(body: Record<string, unknown>) {
	const keys = body.keys as Record<string, unknown> | undefined;
	if (
		typeof body.endpoint !== 'string' ||
		!body.endpoint.startsWith('https://') ||
		body.endpoint.length > 1000 ||
		typeof keys?.p256dh !== 'string' ||
		typeof keys?.auth !== 'string'
	)
		throw new ValidationError('subscription', 'Abonnement invalide.');
	return { endpoint: body.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

export const POST: RequestHandler = (event) =>
	respond(async () => saveSubscription(getDb(), currentUserId(), parse(await readBody(event))));

export const DELETE: RequestHandler = (event) =>
	respond(async () => {
		const body = await readBody(event);
		if (typeof body.endpoint === 'string') removeSubscription(getDb(), currentUserId(), body.endpoint);
	});
