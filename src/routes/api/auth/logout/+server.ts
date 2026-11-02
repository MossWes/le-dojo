import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { SESSION_COOKIE, deleteSession } from '$lib/server/auth-core';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	deleteSession(getDb(), cookies.get(SESSION_COOKIE));
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return json({ ok: true });
};
