import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { securityHeaders } from '$lib/server/security';

// Files created by the app (database, journals) are readable by their owner only.
process.umask(0o077);

// Open the database (and run migrations) at startup, not on the first request.
getDb();

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	for (const [name, value] of Object.entries(securityHeaders)) {
		response.headers.set(name, value);
	}
	return response;
};
