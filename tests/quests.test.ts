import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { questLogs, quests } from '../src/lib/server/db/schema';
import { ValidationError } from '../src/lib/server/services/errors';
import { backfillQuest, questState, setQuestDay } from '../src/lib/server/services/quests';
import { recordRitual } from '../src/lib/server/services/rituals';
import { totalXp } from '../src/lib/server/services/xp';
import { seededDb } from './helpers';

const TODAY = '2026-11-02';

function challenge(db: ReturnType<typeof seededDb>['db']) {
	return db.select().from(quests).where(eq(quests.slug, 'defi-100-jours')).get()!;
}

describe('100-day challenge', () => {
	it('shows day 63 on 2 November and proposes the catch-up', () => {
		const { db } = seededDb();
		const state = questState(challenge(db), [], TODAY);
		expect(state.dayNumber).toBe(63);
		expect(state.endDay).toBe('2026-12-09');
		expect(state.missingDays).toHaveLength(62);
		expect(state.isOver).toBe(false);
	});

	it('catch-up marks the 62 past days as held, with milestones 30 and 50', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		expect(backfillQuest(db, userId, q.id, TODAY)).toBe(62);
		expect(totalXp(db, userId)).toBe(62 * 10 + 50 + 75);
		// Running it again changes nothing.
		expect(backfillQuest(db, userId, q.id, TODAY)).toBe(0);
		expect(totalXp(db, userId)).toBe(745);
	});

	it('a slip removes no XP and does not reset the quest', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		backfillQuest(db, userId, q.id, TODAY);
		setQuestDay(db, userId, q.id, TODAY, 'slip', 'Soirée difficile', TODAY);
		expect(totalXp(db, userId)).toBe(745);
		const logs = db.select().from(questLogs).where(eq(questLogs.questId, q.id)).all();
		const state = questState(q, logs, TODAY);
		expect(state.dayNumber).toBe(63);
		expect(state.held).toBe(62);
		expect(state.slips).toBe(1);
	});

	it('correcting a held day into a slip only cancels that day', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		backfillQuest(db, userId, q.id, TODAY);
		setQuestDay(db, userId, q.id, '2026-10-10', 'slip', null, TODAY);
		expect(totalXp(db, userId)).toBe(735);
		setQuestDay(db, userId, q.id, '2026-10-10', 'held', null, TODAY);
		expect(totalXp(db, userId)).toBe(745);
	});

	it('pays a milestone once, even on a slip day', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		setQuestDay(db, userId, q.id, '2026-09-30', 'slip', null, TODAY); // day 30
		expect(totalXp(db, userId)).toBe(50);
		setQuestDay(db, userId, q.id, '2026-09-30', 'held', null, TODAY);
		setQuestDay(db, userId, q.id, '2026-09-30', 'held', null, TODAY);
		expect(totalXp(db, userId)).toBe(60);
	});

	it('the last day (day 100) gives 300 XP', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		setQuestDay(db, userId, q.id, '2026-12-09', 'held', null, '2026-12-09');
		expect(totalXp(db, userId)).toBe(310);
	});

	it('refuses days outside the quest or in the future', () => {
		const { db, userId } = seededDb();
		const q = challenge(db);
		expect(() => setQuestDay(db, userId, q.id, '2026-08-31', 'held', null, TODAY)).toThrow(ValidationError);
		expect(() => setQuestDay(db, userId, q.id, '2026-11-03', 'held', null, TODAY)).toThrow(ValidationError);
		expect(() => setQuestDay(db, userId, q.id, '2026-12-10', 'held', null, '2026-12-15')).toThrow(ValidationError);
	});

	it('is over after 9 December', () => {
		const { db } = seededDb();
		expect(questState(challenge(db), [], '2026-12-10').isOver).toBe(true);
	});
});

describe('rituals', () => {
	it('pay 10 XP once per day each', () => {
		const { db, userId } = seededDb();
		expect(recordRitual(db, userId, 'reading', TODAY)).toBe(true);
		expect(recordRitual(db, userId, 'reading', TODAY)).toBe(false);
		recordRitual(db, userId, 'oath', TODAY);
		recordRitual(db, userId, 'evening_review', TODAY);
		recordRitual(db, userId, 'reading', '2026-11-03');
		expect(totalXp(db, userId)).toBe(40);
	});
});
