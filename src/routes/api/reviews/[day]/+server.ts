import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { readBody, respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getReview, saveReview } from '$lib/server/services/reviews';

export const GET: RequestHandler = (event) => respond(() => getReview(getDb(), currentUserId(), event.params.day));

export const PUT: RequestHandler = (event) =>
	respond(async () => {
		const b = await readBody(event);
		const text = (v: unknown) => (typeof v === 'string' ? v : '');
		return saveReview(
			getDb(),
			currentUserId(),
			event.params.day,
			{
				didWell: text(b.didWell),
				missedPrinciple: text(b.missedPrinciple),
				fixTomorrow: text(b.fixTomorrow),
				keptWord: (b.keptWord ?? null) as 'oui' | 'en_partie' | 'non' | null,
				energy: (b.energy ?? null) as number | null
			},
			today()
		);
	});
