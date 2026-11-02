import { and, desc, eq } from 'drizzle-orm';
import { isDay, type Day } from '../../dates';
import type { Db } from '../db/client';
import { eveningReviews } from '../db/schema';
import { ValidationError } from './errors';
import { recordRitual } from './rituals';

export type EveningReview = typeof eveningReviews.$inferSelect;
export type ReviewInput = {
	didWell: string;
	missedPrinciple: string;
	fixTomorrow: string;
	keptWord: 'oui' | 'en_partie' | 'non' | null;
	energy: number | null;
};

const MAX_TEXT = 4000;

export function getReview(db: Db, userId: number, day: Day): EveningReview | null {
	return (
		db
			.select()
			.from(eveningReviews)
			.where(and(eq(eveningReviews.userId, userId), eq(eveningReviews.day, day)))
			.get() ?? null
	);
}

export function listReviews(db: Db, userId: number): EveningReview[] {
	return db
		.select()
		.from(eveningReviews)
		.where(eq(eveningReviews.userId, userId))
		.orderBy(desc(eveningReviews.day))
		.all();
}

/** Saves (or corrects) the review of a day and validates the evening ritual once. */
export function saveReview(
	db: Db,
	userId: number,
	day: Day,
	input: ReviewInput,
	today: Day
): { review: EveningReview; xpGranted: boolean } {
	if (!isDay(day) || day > today) throw new ValidationError('day', 'Ce jour n’est pas encore arrivé.');
	for (const key of ['didWell', 'missedPrinciple', 'fixTomorrow'] as const) {
		if (typeof input[key] !== 'string') throw new ValidationError(key, 'Texte attendu.');
		if (input[key].length > MAX_TEXT) throw new ValidationError(key, 'Texte trop long.');
	}
	if (input.keptWord !== null && !['oui', 'en_partie', 'non'].includes(input.keptWord))
		throw new ValidationError('keptWord', 'Réponse inconnue.');
	if (input.energy !== null && (!Number.isInteger(input.energy) || input.energy < 1 || input.energy > 5))
		throw new ValidationError('energy', 'L’énergie va de 1 à 5.');
	const filled =
		input.didWell.trim() || input.missedPrinciple.trim() || input.fixTomorrow.trim() || input.keptWord;
	if (!filled) throw new ValidationError('didWell', 'Le bilan est vide.');

	return db.transaction(() => {
		const values = {
			didWell: input.didWell.trim(),
			missedPrinciple: input.missedPrinciple.trim(),
			fixTomorrow: input.fixTomorrow.trim(),
			keptWord: input.keptWord,
			energy: input.energy
		};
		const review = db
			.insert(eveningReviews)
			.values({ userId, day, ...values })
			.onConflictDoUpdate({ target: [eveningReviews.userId, eveningReviews.day], set: values })
			.returning()
			.get();
		return { review, xpGranted: recordRitual(db, userId, 'evening_review', day) };
	});
}
