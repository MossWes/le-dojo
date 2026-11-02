import { describe, expect, it } from 'vitest';
import { eq, isNull, sql } from 'drizzle-orm';
import { missions, xpEvents } from '../src/lib/server/db/schema';
import { SLockError, ValidationError } from '../src/lib/server/services/errors';
import { createMission, deleteMission, updateMission } from '../src/lib/server/services/missions';
import { totalXp } from '../src/lib/server/services/xp';
import { seededDb } from './helpers';

const DAY = '2026-11-02';

function sumOfJournal(db: ReturnType<typeof seededDb>['db']) {
	return db
		.select({ s: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` })
		.from(xpEvents)
		.where(isNull(xpEvents.revokedAt))
		.get()!.s;
}

describe('S lock', () => {
	it('refuses a second active S mission, naming the active one', () => {
		const { db, userId } = seededDb();
		const attempt = () => createMission(db, userId, { title: 'Autre S', rank: 'S' }, DAY);
		expect(attempt).toThrow(SLockError);
		try {
			attempt();
		} catch (e) {
			expect((e as SLockError).message).toBe(
				'Une seule mission S à la fois. Je termine ou je mets en réserve « Obtenir ma rupture conventionnelle, ou lancer le plan B1 » avant d’en ouvrir une autre.'
			);
		}
	});

	it('refuses promoting a mission to S', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'Promue', rank: 'A' }, DAY);
		expect(() => updateMission(db, userId, m.id, { rank: 'S' }, DAY)).toThrow(SLockError);
	});

	it('allows a new S once the active one is in reserve or done', () => {
		const { db, userId } = seededDb();
		const s = db.select().from(missions).where(eq(missions.slug, 'rupture-conventionnelle')).get()!;
		updateMission(db, userId, s.id, { status: 'reserve', startCondition: 'Après la réponse RH.' }, DAY);
		const s2 = createMission(db, userId, { title: 'Nouvelle S', rank: 'S' }, DAY);
		expect(s2.rank).toBe('S');
		// Bringing the first one back is refused.
		expect(() => updateMission(db, userId, s.id, { status: 'todo' }, DAY)).toThrow(SLockError);
	});

	it('lets the active S mission be edited', () => {
		const { db, userId } = seededDb();
		const s = db.select().from(missions).where(eq(missions.slug, 'rupture-conventionnelle')).get()!;
		expect(updateMission(db, userId, s.id, { status: 'doing' }, DAY).status).toBe('doing');
	});

	it('is also enforced by the database (direct write)', () => {
		const { db, userId } = seededDb();
		expect(() =>
			db.insert(missions).values({ userId, title: 'Contournement', rank: 'S', status: 'todo' }).run()
		).toThrow(/UNIQUE/);
	});
});

describe('mission XP', () => {
	it('ticking grants XP by rank; unticking revokes it', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'B', rank: 'B' }, DAY);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);
		expect(totalXp(db, userId)).toBe(50);
		updateMission(db, userId, m.id, { status: 'todo' }, DAY);
		expect(totalXp(db, userId)).toBe(0);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);
		expect(totalXp(db, userId)).toBe(50);
		// The journal keeps every event; only one is active.
		expect(db.select().from(xpEvents).all()).toHaveLength(2);
	});

	it('ticking twice does not pay twice', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'D', rank: 'D' }, DAY);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);
		updateMission(db, userId, m.id, { status: 'done', notes: 'modifiée' }, DAY);
		expect(totalXp(db, userId)).toBe(10);
	});

	it('changing the rank of a done mission adjusts its XP', () => {
		const { db, userId } = seededDb();
		const m = createMission(db, userId, { title: 'C', rank: 'C', status: 'done' }, DAY);
		updateMission(db, userId, m.id, { rank: 'A' }, DAY);
		expect(totalXp(db, userId)).toBe(150);
	});

	it('dropping or postponing a mission never removes XP', () => {
		const { db, userId } = seededDb();
		const done = createMission(db, userId, { title: 'Faite', rank: 'A', status: 'done' }, DAY);
		const other = createMission(db, userId, { title: 'Abandonnée', rank: 'B', dueDate: '2026-10-01' }, DAY);
		updateMission(db, userId, other.id, { status: 'dropped' }, DAY);
		deleteMission(db, userId, done.id);
		expect(totalXp(db, userId)).toBe(150);
	});

	it('total XP always equals the sum of the journal', () => {
		const { db, userId } = seededDb();
		const ids = (['A', 'B', 'C', 'D'] as const).map((rank) => createMission(db, userId, { title: rank, rank }, DAY).id);
		ids.forEach((id) => updateMission(db, userId, id, { status: 'done' }, DAY));
		updateMission(db, userId, ids[1]!, { status: 'todo' }, DAY);
		expect(totalXp(db, userId)).toBe(sumOfJournal(db));
		expect(totalXp(db, userId)).toBe(150 + 25 + 10);
	});
});

describe('mission rules', () => {
	it('reserve needs a start condition', () => {
		const { db, userId } = seededDb();
		expect(() => createMission(db, userId, { title: 'R', rank: 'B', status: 'reserve' }, DAY)).toThrow(ValidationError);
	});

	it('a test needs a review date', () => {
		const { db, userId } = seededDb();
		expect(() => createMission(db, userId, { title: 'T', rank: 'C', isTest: true }, DAY)).toThrow(ValidationError);
		expect(createMission(db, userId, { title: 'T', rank: 'C', isTest: true, reviewDate: '2026-11-20' }, DAY).isTest).toBe(true);
	});

	it('sub-missions go one level deep only', () => {
		const { db, userId } = seededDb();
		const parent = createMission(db, userId, { title: 'Parent', rank: 'A' }, DAY);
		const child = createMission(db, userId, { title: 'Enfant', rank: 'C', parentId: parent.id }, DAY);
		expect(() => createMission(db, userId, { title: 'Petit-enfant', rank: 'D', parentId: child.id }, DAY)).toThrow(
			ValidationError
		);
	});

	it('rejects invalid dates', () => {
		const { db, userId } = seededDb();
		expect(() => createMission(db, userId, { title: 'X', rank: 'D', dueDate: '2026-13-01' }, DAY)).toThrow(ValidationError);
	});
});
