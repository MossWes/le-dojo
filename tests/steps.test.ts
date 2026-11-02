import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { apiTokens, quests } from '../src/lib/server/db/schema';
import { ValidationError } from '../src/lib/server/services/errors';
import { logSteps, questOverviews } from '../src/lib/server/services/quests';
import { createStepsToken, revokeStepsToken, stepsTokenStatus, userForStepsToken } from '../src/lib/server/services/steps-token';
import { totalXp } from '../src/lib/server/services/xp';
import { RateLimit } from '../src/lib/server/rate-limit';
import { seededDb } from './helpers';

const DAY = '2026-11-02';

describe('steps quest (V2)', () => {
	it('is created with the first steps; held at the goal, logged below, without reproach', () => {
		const { db, userId } = seededDb();
		expect(logSteps(db, userId, DAY, 9123, 8000, DAY)).toEqual({ dayNumber: 1, status: 'held' });
		expect(totalXp(db, userId)).toBe(10);
		const q = db.select().from(quests).where(eq(quests.slug, 'pas-quotidiens')).get()!;
		expect(q).toMatchObject({ kind: 'daily_steps', lengthDays: null, startDate: DAY });
		// A new evening send for the same day replaces the value.
		expect(logSteps(db, userId, DAY, 4200, 8000, DAY).status).toBe('logged');
		expect(totalXp(db, userId)).toBe(0);
		const o = questOverviews(db, userId, DAY).find((x) => x.slug === 'pas-quotidiens')!;
		expect(o.calendar[0]).toMatchObject({ status: 'logged', value: 4200 });
	});

	it('refuses odd dates and values', () => {
		const { db, userId } = seededDb();
		expect(() => logSteps(db, userId, '2026-11-03', 100, 8000, DAY)).toThrow(ValidationError);
		expect(() => logSteps(db, userId, '2026-10-01', 100, 8000, DAY)).toThrow(ValidationError);
		expect(() => logSteps(db, userId, DAY, -5, 8000, DAY)).toThrow(ValidationError);
	});
});

describe('steps token', () => {
	it('is stored hashed, identifies me, and stops working when revoked or replaced', () => {
		const { db, userId } = seededDb();
		const t1 = createStepsToken(db, userId);
		expect(t1.startsWith('dojo_')).toBe(true);
		expect(db.select().from(apiTokens).all().some((r) => r.tokenHash === t1)).toBe(false);
		expect(userForStepsToken(db, t1)?.userId).toBe(userId);
		expect(stepsTokenStatus(db, userId).lastUsedAt).not.toBeNull();
		const t2 = createStepsToken(db, userId);
		expect(userForStepsToken(db, t1)).toBeNull();
		expect(userForStepsToken(db, t2)?.userId).toBe(userId);
		revokeStepsToken(db, userId);
		expect(userForStepsToken(db, t2)).toBeNull();
		expect(stepsTokenStatus(db, userId).active).toBe(false);
	});
});

describe('rate limit', () => {
	it('allows 10 calls per hour', () => {
		const r = new RateLimit(10, 3_600_000);
		for (let i = 0; i < 10; i++) expect(r.take('a', 1000)).toBe(true);
		expect(r.take('a', 1000)).toBe(false);
		expect(r.take('a', 1000 + 3_600_001)).toBe(true);
	});
});
