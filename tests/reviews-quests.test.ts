import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { quests } from '../src/lib/server/db/schema';
import { ValidationError } from '../src/lib/server/services/errors';
import { backfillQuest, questOverviews, setQuestDay } from '../src/lib/server/services/quests';
import { getReview, listReviews, saveReview } from '../src/lib/server/services/reviews';
import { totalXp } from '../src/lib/server/services/xp';
import { seededDb } from './helpers';

const DAY = '2026-11-02';
const review = { didWell: 'J’ai appelé deux prospects.', missedPrinciple: '', fixTomorrow: 'Me coucher plus tôt.', keptWord: 'en_partie' as const, energy: 3 };

describe('evening review', () => {
	it('is saved, readable and validates the ritual once', () => {
		const { db, userId } = seededDb();
		expect(saveReview(db, userId, DAY, review, DAY).xpGranted).toBe(true);
		expect(saveReview(db, userId, DAY, { ...review, energy: 4 }, DAY).xpGranted).toBe(false);
		expect(getReview(db, userId, DAY)).toMatchObject({ didWell: review.didWell, energy: 4, keptWord: 'en_partie' });
		expect(totalXp(db, userId)).toBe(10);
	});

	it('lists reviews, newest first', () => {
		const { db, userId } = seededDb();
		saveReview(db, userId, '2026-11-01', review, DAY);
		saveReview(db, userId, DAY, review, DAY);
		expect(listReviews(db, userId).map((r) => r.day)).toEqual([DAY, '2026-11-01']);
	});

	it('refuses empty reviews, future days and bad values', () => {
		const { db, userId } = seededDb();
		const empty = { didWell: ' ', missedPrinciple: '', fixTomorrow: '', keptWord: null, energy: null };
		expect(() => saveReview(db, userId, DAY, empty, DAY)).toThrow(ValidationError);
		expect(() => saveReview(db, userId, '2026-11-03', review, DAY)).toThrow(ValidationError);
		expect(() => saveReview(db, userId, DAY, { ...review, energy: 6 }, DAY)).toThrow(ValidationError);
		expect(() => saveReview(db, userId, DAY, { ...review, keptWord: 'peut-être' as never }, DAY)).toThrow(ValidationError);
	});
});

describe('quest overview', () => {
	it('builds a 100-day calendar with statuses', () => {
		const { db, userId } = seededDb();
		const q = db.select().from(quests).where(eq(quests.slug, 'defi-100-jours')).get()!;
		backfillQuest(db, userId, q.id, DAY);
		setQuestDay(db, userId, q.id, DAY, 'slip', 'Soirée', DAY);
		const [o] = questOverviews(db, userId, DAY);
		expect(o!.calendar).toHaveLength(100);
		expect(o!.calendar[0]).toMatchObject({ day: '2026-09-01', number: 1, status: 'held' });
		expect(o!.calendar[62]).toMatchObject({ day: DAY, number: 63, status: 'slip', note: 'Soirée', isToday: true });
		expect(o!.calendar[63]).toMatchObject({ number: 64, status: null, isFuture: true });
		expect(o!.calendar[99]!.day).toBe('2026-12-09');
		expect(o!.state.milestones.map((m) => m.reached)).toEqual([true, true, false, false]);
		expect(o!.finished).toBe(false);
	});

	it('is finished after the last day', () => {
		const { db, userId } = seededDb();
		expect(questOverviews(db, userId, '2026-12-10')[0]!.finished).toBe(true);
	});
});
