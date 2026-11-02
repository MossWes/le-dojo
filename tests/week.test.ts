import { describe, expect, it } from 'vitest';
import { weekday, weekStart } from '../src/lib/dates';
import { createMission, updateMission } from '../src/lib/server/services/missions';
import { recordRitual } from '../src/lib/server/services/rituals';
import { planWeek, weeklyReview } from '../src/lib/server/services/week';
import { seededDb } from './helpers';

const SUNDAY = '2026-11-08';

describe('week helpers', () => {
	it('weeks start on Monday', () => {
		expect(weekday('2026-11-02')).toBe(0);
		expect(weekday(SUNDAY)).toBe(6);
		expect(weekStart(SUNDAY)).toBe('2026-11-02');
	});
});

describe('Sunday review', () => {
	it('shows done missions, XP of the week, what slipped, and plans next week', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'Faite', rank: 'B' }, '2026-11-04');
		updateMission(db, userId, m.id, { status: 'done' }, '2026-11-04');
		recordRitual(db, userId, 'reading', '2026-11-05');
		recordRitual(db, userId, 'reading', '2026-10-30'); // previous week: not counted
		const r = weeklyReview(db, userId, SUNDAY);
		expect(r.start).toBe('2026-11-02');
		expect(r.nextMonday).toBe('2026-11-09');
		expect(r.xp).toBe(60);
		// cep-rendez-vous and simuler-droits were planned on 3 Nov and due on 6 Nov.
		expect(r.slipped.map((x) => x.title)).toContain("Simuler mes droits au chômage et l'ARCE sur le site de France Travail");
		const ids = r.candidates.slice(0, 2).map((c) => c.id);
		expect(planWeek(db, userId, ids, '2026-11-09', SUNDAY)).toBe(2);
		expect(weeklyReview(db, userId, SUNDAY).candidates.filter((c) => c.plannedNextWeek).map((c) => c.id)).toEqual(ids);
	});
});
