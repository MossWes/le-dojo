import { formatDayLong } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { listReviews } from '$lib/server/services/reviews';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	reviews: listReviews(getDb(), currentUserId()).map((r) => ({ ...r, label: formatDayLong(r.day) }))
});
