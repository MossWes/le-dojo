import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { missions, quests } from '../src/lib/server/db/schema';
import { createMission, updateMission } from '../src/lib/server/services/missions';
import { markReadingSeen, nextReading, readingOfDay, readingToMission } from '../src/lib/server/services/readings';
import { recordOath } from '../src/lib/server/services/rituals';
import { totalXp } from '../src/lib/server/services/xp';
import { buildToday } from '../src/lib/server/today';
import { seededDb } from './helpers';

const DAY = '2026-11-02';
// 2 Nov 2026, 21:35 in Paris (UTC+1)
const EVENING = new Date('2026-11-02T20:35:00Z');
const MORNING = new Date('2026-11-02T03:45:00Z'); // 04:45 in Paris

describe('reading of the day (service)', () => {
	it('"Lecture suivante" moves on, stays for the day, and earns nothing', () => {
		const { db, userId } = seededDb();
		expect(readingOfDay(db, userId, DAY)?.reading.slug).toBe('neg-01-ce-qui-depend');
		expect(nextReading(db, userId, DAY)?.reading.slug).toBe('neg-02-preparer-terrain');
		expect(readingOfDay(db, userId, DAY)?.reading.slug).toBe('neg-02-preparer-terrain');
		expect(totalXp(db, userId)).toBe(0);
		// The next day starts again from the day's own reading.
		expect(readingOfDay(db, userId, '2026-11-03')?.reading.slug).toBe('neg-02-preparer-terrain');
	});

	it('the reading ritual pays 10 XP once, even after "Lecture suivante"', () => {
		const { db, userId } = seededDb();
		const first = readingOfDay(db, userId, DAY)!.reading;
		expect(markReadingSeen(db, userId, first.id, DAY, false).xpGranted).toBe(true);
		const second = nextReading(db, userId, DAY)!.reading;
		expect(markReadingSeen(db, userId, second.id, DAY, true).xpGranted).toBe(false);
		expect(totalXp(db, userId)).toBe(10);
		expect(readingOfDay(db, userId, DAY)?.reading.id).toBe(second.id);
	});

	it('the action becomes a rank D mission planned today', () => {
		const { db, userId } = seededDb();
		const r = readingOfDay(db, userId, DAY)!.reading;
		const m = readingToMission(db, userId, r.id, DAY);
		expect(m).toMatchObject({ title: r.action, rank: 'D', plannedDate: DAY, source: 'reading' });
	});
});

describe('Today screen data', () => {
	it('gathers date, grade, S mission, reading, quests and rituals', () => {
		const { db, userId } = seededDb();
		const t = buildToday(db, userId, EVENING);
		expect(t.day).toBe(DAY);
		expect(t.dayLabel).toBe('lundi 2 novembre');
		expect(t.progress.grade.name).toBe('Aspirant');
		expect(t.sMission?.title).toMatch(/rupture conventionnelle/);
		expect(t.reading?.reading.slug).toBe('neg-01-ce-qui-depend');
		expect(t.quests[0]).toMatchObject({ dayNumber: 63, lengthDays: 100, missingDays: 62 });
		expect(t.rituals).toEqual({ reading: false, oath: false, evening_review: false });
		expect(t.isEvening).toBe(true);
		expect(t.showMorning).toBe(false);
	});

	it('shows the morning mantra between 03:30 and 08:00, and the evening block from 20:00', () => {
		const { db, userId } = seededDb();
		const t = buildToday(db, userId, MORNING);
		expect(t.showMorning).toBe(true);
		expect(t.isEvening).toBe(false);
	});

	it('lists missions planned up to today or due today, sorted by rank', () => {
		const { db, userId } = seededDb();
		// On 3 Nov, two seeded B missions are planned.
		const t = buildToday(db, userId, new Date('2026-11-03T10:00:00Z'));
		expect(t.missions.map((m) => m.title)).toEqual([
			'Prendre rendez-vous avec un conseiller en évolution professionnelle (mon-cep.org)',
			"Simuler mes droits au chômage et l'ARCE sur le site de France Travail"
		]);
		createMission(db, userId, { title: 'Due aujourd’hui', rank: 'A', dueDate: '2026-11-03' }, '2026-11-03');
		expect(buildToday(db, userId, new Date('2026-11-03T10:00:00Z')).missions[0]?.title).toBe('Due aujourd’hui');
	});

	it('keeps a mission ticked today in the list, checked', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'Faite', rank: 'C', plannedDate: DAY }, DAY);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);
		const t = buildToday(db, userId, EVENING);
		expect(t.missions.find((x) => x.id === m.id)?.done).toBe(true);
	});

	it('brings a test back on its review day with the question', () => {
		const { db, userId } = seededDb();
		createMission(db, userId, { title: 'Test', rank: 'C', isTest: true, reviewDate: DAY }, DAY);
		expect(buildToday(db, userId, EVENING).missions.find((m) => m.title === 'Test')?.testReview).toBe(true);
	});

	it('marks the oath ritual', () => {
		const { db, userId } = seededDb();
		expect(recordOath(db, userId, DAY)).toBe(true);
		expect(recordOath(db, userId, DAY)).toBe(false);
		expect(buildToday(db, userId, EVENING).rituals.oath).toBe(true);
	});

	it('hides a quest that is over', () => {
		const { db, userId } = seededDb();
		expect(buildToday(db, userId, new Date('2026-12-10T10:00:00Z')).quests).toHaveLength(0);
		expect(db.select().from(quests).where(eq(quests.slug, 'defi-100-jours')).get()).toBeTruthy();
		expect(db.select().from(missions).all().length).toBe(21);
	});
});
