import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

/** The signed-in user. Pages are redirected to the login screen, the API answers 401. */
export function currentUserId(): number {
	const event = getRequestEvent();
	const id = event.locals.userId;
	if (id) return id;
	if (event.url.pathname.startsWith('/api/')) error(401, 'Je dois me reconnecter.');
	redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
}
