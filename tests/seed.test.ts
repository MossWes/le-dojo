import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { fronts, missions, phases, quests, readings, users } from '../src/lib/server/db/schema';
import { ContentFormatError } from '../src/lib/server/content-format';
import { importContent, runSeed } from '../src/lib/server/seed';
import { freshDb } from './helpers';

const count = (db: ReturnType<typeof freshDb>['db']) => ({
	users: db.select().from(users).all().length,
	fronts: db.select().from(fronts).all().length,
	missions: db.select().from(missions).all().length,
	quests: db.select().from(quests).all().length,
	phases: db.select().from(phases).all().length,
	readings: db.select().from(readings).all().length
});

describe('seed', () => {
	it('loads everything from seed/', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		expect(count(db)).toEqual({ users: 1, fronts: 9, missions: 21, quests: 1, phases: 2, readings: 19 });
		const user = db.select().from(users).get()!;
		expect(user.passwordHash).toBeNull();
		expect(user.settings.timezone).toBe('Europe/Paris');
	});

	it('can run again without duplicates', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		const report = runSeed(db, './seed');
		expect(count(db)).toEqual({ users: 1, fronts: 9, missions: 21, quests: 1, phases: 2, readings: 19 });
		expect(report.missions).toEqual({ created: 0, updated: 0, kept: 21 });
	});

	it('links missions to their fronts and keeps reserve conditions', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		const m = db.select().from(missions).where(eq(missions.slug, 'relancer-le-flow')).get()!;
		const f = db.select().from(fronts).where(eq(fronts.id, m.frontId!)).get()!;
		expect(f.slug).toBe('le-flow');
		expect(m.status).toBe('reserve');
		expect(m.startCondition).toContain('plancher');
		expect(m.source).toBe('seed');
	});

	it('never overwrites what I changed or deleted in the app', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		db.update(missions).set({ title: 'Mon titre' }).where(eq(missions.slug, 'notaire')).run();
		db.delete(missions).where(eq(missions.slug, 'site-wash31')).run();
		db.update(fronts).set({ name: 'Wash 31 (Toulouse)' }).where(eq(fronts.slug, 'wash31')).run();
		runSeed(db, './seed');
		expect(db.select().from(missions).where(eq(missions.slug, 'notaire')).get()!.title).toBe('Mon titre');
		expect(db.select().from(missions).where(eq(missions.slug, 'site-wash31')).get()).toBeUndefined();
		expect(db.select().from(fronts).where(eq(fronts.slug, 'wash31')).get()!.name).toBe('Wash 31 (Toulouse)');
	});
});

describe('readings import', () => {
	const reading = {
		slug: 'prep-01-test',
		group: 'phase',
		phase_slug: 'preparation',
		order: 1,
		situations: [],
		pillar: 'musashi',
		source: 'Musashi',
		quote: null,
		quote_kind: 'reformulation',
		title: 'Titre',
		body: 'Corps',
		mantra: 'Mantra',
		action: 'Action',
		evening_question: 'Question ?',
		symbol: 'mframadan'
	};

	it('adds new readings and updates existing ones by slug, touching nothing else', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		const before = count(db);
		const r1 = importContent(db, { format_version: 1, readings: [reading] });
		expect(r1.readings).toEqual({ created: 1, updated: 0, kept: 0 });
		const r2 = importContent(db, { format_version: 1, readings: [{ ...reading, title: 'Nouveau titre' }] });
		expect(r2.readings).toEqual({ created: 0, updated: 1, kept: 0 });
		expect(db.select().from(readings).where(eq(readings.slug, 'prep-01-test')).get()!.title).toBe('Nouveau titre');
		expect(count(db)).toEqual({ ...before, readings: before.readings + 1 });
	});

	it('rejects an invalid file with clear French messages, and writes nothing', () => {
		const { db } = freshDb();
		runSeed(db, './seed');
		const bad = { readings: [{ ...reading, pillar: 'zen', symbol: undefined }, { ...reading, phase_slug: 'inconnue', slug: 'x-2' }] };
		expect(() => importContent(db, bad)).toThrow(ContentFormatError);
		try {
			importContent(db, bad);
		} catch (e) {
			expect((e as ContentFormatError).problems.join('\n')).toMatch(/pillar/);
			expect((e as ContentFormatError).problems.join('\n')).toMatch(/symbol/);
		}
		expect(() => importContent(db, { readings: [{ ...reading, phase_slug: 'inconnue' }] })).toThrow(/phase « inconnue » inconnue/);
		expect(db.select().from(readings).all()).toHaveLength(19);
	});
});
