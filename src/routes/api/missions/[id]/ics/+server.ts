import { error } from '@sveltejs/kit';
import { missionIcs } from '$lib/calendar';
import { intParam } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getMission } from '$lib/server/services/missions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	let ics: string | null = null;
	try {
		ics = missionIcs(getMission(getDb(), currentUserId(), intParam(params.id, 'id')));
	} catch {
		error(404, 'Mission introuvable.');
	}
	if (!ics) error(400, 'Cette mission n’a pas de date.');
	return new Response(ics, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="mission-${params.id}.ics"`,
			'cache-control': 'no-store'
		}
	});
};
