import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { missions, quests, users } from '../src/lib/server/db/schema';
import { exportAll, importAll } from '../src/lib/server/export';
import { ValidationError } from '../src/lib/server/services/errors';
import { createMission, updateMission } from '../src/lib/server/services/missions';
import { backfillQuest } from '../src/lib/server/services/quests';
import { saveReview } from '../src/lib/server/services/reviews';
import { updateSettings } from '../src/lib/server/services/settings';
import { totalXp } from '../src/lib/server/services/xp';
import { setPassword } from '../src/lib/server/auth-core';
import { freshDb, seededDb } from './helpers';

const DAY = '2026-11-02';

describe('export / import', () => {
	it('exports everything and re-imports it on a fresh installation', async () => {
		const { db, userId } = seededDb();
		await setPassword(db, 'une phrase de passe longue');
		const m = createMission(db, userId, { title: 'Exportée', rank: 'B' }, DAY);
		updateMission(db, userId, m.id, { status: 'done' }, DAY);
		const q = db.select().from(quests).get()!;
		backfillQuest(db, userId, q.id, DAY);
		saveReview(db, userId, DAY, { didWell: 'Oui', missedPrinciple: '', fixTomorrow: '', keptWord: 'oui', energy: 4 }, DAY);
		updateSettings(db, userId, { voice_rate: 0.8 });

		const data = exportAll(db, userId);
		const text = JSON.stringify(data);
		expect(text).not.toContain('argon2');
		expect(data.missions).toHaveLength(22);
		expect(data.readings).toHaveLength(19);

		const fresh = freshDb();
		const counts = importAll(fresh.db, JSON.parse(text));
		expect(counts.missions).toBe(22);
		expect(totalXp(fresh.db, userId)).toBe(totalXp(db, userId));
		expect(fresh.db.select().from(users).get()).toMatchObject({ passwordHash: null, settings: expect.objectContaining({ voice_rate: 0.8 }) });
		expect(fresh.db.select().from(missions).where(eq(missions.id, m.id)).get()?.title).toBe('Exportée');
		// Re-exporting gives the same data (apart from the date).
		const again = exportAll(fresh.db, userId);
		expect({ ...again, exported_at: '' }).toEqual({ ...data, exported_at: '' });
	});

	it('refuses to import into a non-empty database or a foreign file', () => {
		const { db, userId } = seededDb();
		const data = exportAll(db, userId);
		expect(() => importAll(db, data)).toThrow(/pas vide/);
		expect(() => importAll(freshDb().db, { hello: 'world' })).toThrow(/format/);
	});
});

describe('settings', () => {
	it('updates valid values and rejects invalid ones', () => {
		const { db, userId } = seededDb();
		expect(updateSettings(db, userId, { ritual_evening_start: '19:30', voice_name: 'Thomas' })).toMatchObject({
			ritual_evening_start: '19:30',
			voice_name: 'Thomas'
		});
		expect(() => updateSettings(db, userId, { ritual_morning_time: '25:00' })).toThrow(ValidationError);
		expect(() => updateSettings(db, userId, { voice_rate: 3 })).toThrow(ValidationError);
		expect(() => updateSettings(db, userId, { steps_goal: 12.5 })).toThrow(ValidationError);
		expect(() => updateSettings(db, userId, { ritual_evening_end: '18:00' })).toThrow(ValidationError);
		expect(() => updateSettings(db, userId, { ritual_morning_mode: 'nuit' })).toThrow(ValidationError);
	});
});
