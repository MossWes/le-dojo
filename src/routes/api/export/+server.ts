import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { exportAll } from '$lib/server/export';

export const GET: RequestHandler = () => {
	const data = exportAll(getDb(), currentUserId());
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'content-disposition': `attachment; filename="le-dojo-export-${today()}.json"`,
			'cache-control': 'no-store'
		}
	});
};
