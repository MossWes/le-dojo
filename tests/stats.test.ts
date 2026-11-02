import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { quests } from '../src/lib/server/db/schema';
import { createMission, updateMission } from '../src/lib/server/services/missions';
import { backfillQuest } from '../src/lib/server/services/quests';
import { recordRitual } from '../src/lib/server/services/rituals';
import { statistics } from '../src/lib/server/services/stats';
import { totalXp } from '../src/lib/server/services/xp';
import { seededDb } from './helpers';

const DAY = '2026-11-02';

describe('statistics', () => {
	it('computes regularity, missions by front and the XP curve from the journal', () => {
		const { db, userId } = seededDb();
		recordRitual(db, userId, 'reading', DAY);
		recordRitual(db, userId, 'oath', DAY);
		recordRitual(db, userId, 'reading', '2026-11-01');
		const q = db.select().from(quests).where(eq(quests.slug, 'defi-100-jours')).get()!;
		backfillQuest(db, userId, q.id, DAY);
		const m = createMission(db, userId, { title: 'Faite', rank: 'A' }, DAY);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);

		const s = statistics(db, userId, DAY);
		expect(s.regularity).toHaveLength(30);
		expect(s.regularity.at(-1)).toEqual({ day: DAY, rituals: 2, held: false });
		expect(s.regularity.at(-2)).toEqual({ day: '2026-11-01', rituals: 1, held: true });
		expect(s.daysWithRitual).toBe(2);
		expect(s.byFront.find((f) => f.name === 'Sans front')).toEqual({ name: 'Sans front', done: 1, open: 0 });
		expect(s.byFront.find((f) => f.name === 'Wash 31')).toEqual({ name: 'Wash 31', done: 0, open: 3 });
		expect(s.curve[0]!.day).toBe('2026-09-01');
		expect(s.curve.at(-1)!.total).toBe(totalXp(db, userId));
	});
});
