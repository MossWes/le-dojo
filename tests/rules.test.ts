import { describe, expect, it } from 'vitest';
import { gradeFor, milestoneOn, questDayNumber, questEndDay, XP_BY_RANK, XP_BY_RITUAL } from '../src/lib/rules';

describe('XP values', () => {
	it('match the brief', () => {
		expect(XP_BY_RANK).toEqual({ S: 500, A: 150, B: 50, C: 25, D: 10 });
		expect(XP_BY_RITUAL).toEqual({ reading: 10, oath: 10, evening_review: 10 });
	});
});

describe('grades', () => {
	it.each([
		[0, 'Aspirant'],
		[299, 'Aspirant'],
		[300, 'Ashigaru'],
		[999, 'Ashigaru'],
		[1000, 'Rōnin'],
		[3000, 'Samouraï'],
		[7000, 'Hatamoto'],
		[12000, "Maître d'armes"],
		[20000, 'Kensei'],
		[99999, 'Kensei']
	])('%i XP → %s', (xp, name) => {
		expect(gradeFor(xp).grade.name).toBe(name);
	});

	it('gives progress towards the next grade', () => {
		const p = gradeFor(120);
		expect(p.next?.name).toBe('Ashigaru');
		expect(p.xpInGrade).toBe(120);
		expect(p.xpToNext).toBe(300);
		expect(p.progress).toBeCloseTo(0.4);
	});

	it('stays full at the last grade', () => {
		expect(gradeFor(25000)).toMatchObject({ next: null, xpToNext: null, progress: 1 });
	});
});

describe('quest days', () => {
	it('2 November 2026 is day 63 of the 100-day challenge', () => {
		expect(questDayNumber('2026-09-01', '2026-11-02')).toBe(63);
	});

	it('the challenge ends on 9 December 2026 (day 100)', () => {
		expect(questEndDay('2026-09-01', 100)).toBe('2026-12-09');
		expect(questDayNumber('2026-09-01', '2026-12-09')).toBe(100);
	});

	it('finds milestones', () => {
		const ms = [{ day: 30, xp: 50 }, { day: 100, xp: 300 }];
		expect(milestoneOn(ms, 30)?.xp).toBe(50);
		expect(milestoneOn(ms, 31)).toBeNull();
	});
});
