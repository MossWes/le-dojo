import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';

// Used by the Docker healthcheck: answers only if the database responds.
export function GET() {
	getDb().get(sql`select 1`);
	return json({ ok: true });
}
