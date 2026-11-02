import { error } from '@sveltejs/kit';
import { formatDayLong, isDay, today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { readingOfDay } from '$lib/server/services/readings';
import { getReview } from '$lib/server/services/reviews';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const userId = currentUserId();
	const now = today();
	const day = url.searchParams.get('day') ?? now;
	if (!isDay(day) || day > now) error(404, 'Jour invalide.');
	return {
		day,
		isToday: day === now,
		dayLabel: formatDayLong(day),
		review: getReview(db, userId, day),
		question: day === now ? (readingOfDay(db, userId, day)?.reading.eveningQuestion ?? null) : null
	};
};
