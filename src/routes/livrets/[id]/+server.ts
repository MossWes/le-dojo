import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { currentUserId } from '$lib/server/auth';
import { livretPath } from '$lib/server/livrets';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	currentUserId();
	const path = livretPath(params.id);
	if (!path) error(404, 'Livret introuvable.');
	return new Response(await readFile(path), {
		headers: {
			'content-type': 'application/pdf',
			'cache-control': 'private, max-age=86400'
		}
	});
};
