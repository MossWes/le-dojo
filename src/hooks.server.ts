import { json, type Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { SESSION_COOKIE, deleteExpiredSessions, validateSession } from '$lib/server/auth-core';
import { securityHeaders } from '$lib/server/security';

// Open the database (and run migrations) at startup, not on the first request.
deleteExpiredSessions(getDb());

// Everything needs a session, except these.
const PUBLIC = new Set(['/login', '/api/auth/login', '/api/health', '/api/integrations/steps']);

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	const session = validateSession(getDb(), token);
	event.locals.userId = session?.userId ?? null;
	if (session?.renewed) {
		event.cookies.set(SESSION_COOKIE, token!, {
			path: '/',
			httpOnly: true,
			secure: event.url.protocol === 'https:',
			sameSite: 'lax',
			expires: session.expires
		});
	}

	const path = event.url.pathname;
	if (!session && !PUBLIC.has(path)) {
		if (path.startsWith('/api/'))
			return json({ code: 'AUTH', message: 'Je dois me reconnecter.' }, { status: 401 });
		// Data requests are redirected by their loaders (currentUserId); full pages here.
		if (!event.isDataRequest)
			return new Response(null, {
				status: 303,
				headers: { location: `/login?next=${encodeURIComponent(path + event.url.search)}` }
			});
	}

	const response = await resolve(event);
	for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value);
	// Personal data: never stored by shared caches.
	if (!response.headers.has('cache-control')) response.headers.set('cache-control', 'private, no-cache');
	return response;
};
