// POST /api/integrations/steps — called each evening by the iPhone shortcut (annexe 4).
//   Authorization: Bearer <jeton>   body: { "date": "YYYY-MM-DD", "steps": 9123 }
import { json } from '@sveltejs/kit';
import { today } from '$lib/dates';
import { getDb } from '$lib/server/db';
import { RateLimit } from '$lib/server/rate-limit';
import { ValidationError } from '$lib/server/services/errors';
import { logSteps } from '$lib/server/services/quests';
import { userForStepsToken } from '$lib/server/services/steps-token';
import { userSettings } from '$lib/server/today';
import type { RequestHandler } from './$types';

const limit = new RateLimit(10, 60 * 60_000);

export const POST: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
	const db = getDb();
	const owner = userForStepsToken(db, token);
	if (!owner) return json({ ok: false, message: 'Jeton invalide.' }, { status: 401 });
	if (!limit.take(String(owner.tokenId)))
		return json({ ok: false, message: 'Trop d’envois. Je réessaie dans une heure.' }, { status: 429 });

	const body = await request.json().catch(() => null);
	const steps = typeof body?.steps === 'string' ? Number(body.steps.replace(/\s/g, '').replace(',', '.')) : body?.steps;
	try {
		const goal = userSettings(db, owner.userId).steps_goal;
		const r = logSteps(db, owner.userId, String(body?.date ?? ''), Math.round(Number(steps)), goal, today());
		return json({ ok: true, day: r.dayNumber, status: r.status });
	} catch (e) {
		if (e instanceof ValidationError) return json({ ok: false, message: e.message }, { status: 400 });
		throw e;
	}
};
