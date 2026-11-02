import { error } from '@sveltejs/kit';
import { formatDayLong, today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getReview } from '$lib/server/services/reviews';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const review = getReview(getDb(), currentUserId(), params.day);
	if (!review) error(404, 'Bilan introuvable.');
	return { review, label: formatDayLong(review.day), editable: review.day <= today() };
};
