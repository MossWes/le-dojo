import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { SESSION_COOKIE, checkLogin, createSession } from '$lib/server/auth-core';
import { loginThrottle } from '$lib/server/throttle';
import type { RequestHandler } from './$types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const POST: RequestHandler = async ({ request, cookies, getClientAddress, url }) => {
	// Behind Traefik the address comes from X-Forwarded-For; never fail the login if it is missing.
	let address = 'inconnue';
	try {
		address = getClientAddress();
	} catch {
		/* keep the shared bucket */
	}
	if (loginThrottle.isBlocked(address))
		return json({ code: 'THROTTLED', message: 'Trop d’essais. Je réessaie dans quelques minutes.' }, { status: 429 });

	const body = await request.json().catch(() => null);
	const password = typeof body?.password === 'string' ? body.password : '';
	const userId = password ? await checkLogin(getDb(), password) : null;
	if (!userId) {
		loginThrottle.fail(address);
		await wait(400);
		return json({ code: 'BAD_PASSWORD', message: 'Mot de passe incorrect.' }, { status: 401 });
	}
	loginThrottle.succeed(address);
	const { token, expires } = createSession(getDb(), userId);
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		expires
	});
	return json({ ok: true });
};
