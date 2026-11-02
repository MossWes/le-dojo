import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { fronts, missions } from '../src/lib/server/db/schema';
import { parseMissionFilters } from '../src/lib/server/api';
import { ValidationError } from '../src/lib/server/services/errors';
import { listFronts } from '../src/lib/server/services/fronts';
import { createMission, listMissions, subMissions, updateMission } from '../src/lib/server/services/missions';
import { seededDb } from './helpers';

const DAY = '2026-11-02';

describe('mission list', () => {
	it('shows the 18 active missions by default, S first', () => {
		const { db, userId } = seededDb();
		const list = listMissions(db, userId);
		expect(list).toHaveLength(18);
		expect(list[0]?.rank).toBe('S');
		expect(list.map((m) => m.rank).join('')).toMatch(/^S+A+B+C+$/);
	});

	it('sorts by due date inside a rank', () => {
		const { db, userId } = seededDb();
		const bs = listMissions(db, userId, { rank: 'B' }).map((m) => m.dueDate);
		expect(bs).toEqual([...bs].sort());
	});

	it('filters reserve, tests and done', () => {
		const { db, userId } = seededDb();
		expect(listMissions(db, userId, { view: 'reserve' })).toHaveLength(3);
		expect(listMissions(db, userId, { view: 'tests' })).toHaveLength(0);
		const t = createMission(db, userId, { title: 'Test', rank: 'C', isTest: true, reviewDate: '2026-11-20' }, DAY);
		expect(listMissions(db, userId, { view: 'tests' }).map((m) => m.id)).toEqual([t.id]);
		updateMission(db, userId, t.id, { status: 'done' }, DAY);
		const dropped = createMission(db, userId, { title: 'Lâchée', rank: 'D' }, DAY);
		updateMission(db, userId, dropped.id, { status: 'dropped' }, DAY);
		expect(listMissions(db, userId, { view: 'done' }).map((m) => m.title).sort()).toEqual(['Lâchée', 'Test']);
		expect(listMissions(db, userId, { view: 'tests' })).toHaveLength(0);
	});

	it('filters by rank and by front', () => {
		const { db, userId } = seededDb();
		const wash = db.select().from(fronts).where(eq(fronts.slug, 'wash31')).get()!;
		const list = listMissions(db, userId, { frontId: wash.id });
		expect(list.map((m) => m.slug).sort()).toEqual(['grille-tarifaire', 'site-wash31', 'wash31-3-accords']);
		expect(listMissions(db, userId, { frontId: wash.id, rank: 'B' }).map((m) => m.slug)).toEqual(['grille-tarifaire']);
	});

	it('reads filters from the URL and ignores unknown values', () => {
		expect(parseMissionFilters(new URLSearchParams('view=reserve&rank=A&front=3'))).toEqual({
			view: 'reserve',
			rank: 'A',
			frontId: 3
		});
		expect(parseMissionFilters(new URLSearchParams('view=x&rank=Z&front=-1'))).toEqual({
			view: undefined,
			rank: undefined,
			frontId: undefined
		});
	});

	it('lists active fronts before fronts in reserve', () => {
		const { db, userId } = seededDb();
		const list = listFronts(db, userId);
		expect(list.map((f) => f.status)).toEqual([...Array(6).fill('active'), ...Array(3).fill('reserve')]);
	});
});

describe('mission rules (step 4)', () => {
	it('refuses a front that does not exist', () => {
		const { db, userId } = seededDb();
		expect(() => createMission(db, userId, { title: 'X', rank: 'D', frontId: 999 }, DAY)).toThrow(ValidationError);
	});

	it('a mission with sub-missions cannot become a sub-mission', () => {
		const { db, userId } = seededDb();
		const a = createMission(db, userId, { title: 'A', rank: 'A' }, DAY);
		const b = createMission(db, userId, { title: 'B', rank: 'B' }, DAY);
		createMission(db, userId, { title: 'A1', rank: 'C', parentId: a.id }, DAY);
		expect(() => updateMission(db, userId, a.id, { parentId: b.id }, DAY)).toThrow(ValidationError);
		expect(subMissions(db, userId, a.id).map((m) => m.title)).toEqual(['A1']);
	});

	it('deleting a mission deletes its sub-missions', () => {
		const { db, userId } = seededDb();
		const a = createMission(db, userId, { title: 'A', rank: 'A' }, DAY);
		createMission(db, userId, { title: 'A1', rank: 'C', parentId: a.id }, DAY);
		db.delete(missions).where(eq(missions.id, a.id)).run();
		expect(db.select().from(missions).where(eq(missions.title, 'A1')).get()).toBeUndefined();
	});
});
