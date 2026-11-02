import { currentUserId } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

// Every tab requires a session (redirects to /login otherwise).
export const load: LayoutServerLoad = () => {
	currentUserId();
	return {};
};
