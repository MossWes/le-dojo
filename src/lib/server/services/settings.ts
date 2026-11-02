import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { users, type UserSettings } from '../db/schema';
import { userSettings } from '../today';
import { ValidationError } from './errors';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validates and merges a partial settings change. */
export function updateSettings(db: Db, userId: number, body: Record<string, unknown>): UserSettings {
	const next: UserSettings = { ...userSettings(db, userId) };
	for (const key of ['ritual_morning_time', 'ritual_morning_until', 'ritual_evening_start', 'ritual_evening_end'] as const) {
		if (body[key] === undefined) continue;
		if (typeof body[key] !== 'string' || !TIME.test(body[key] as string))
			throw new ValidationError(key, 'Heure attendue au format HH:MM.');
		next[key] = body[key] as string;
	}
	if (body.ritual_morning_mode !== undefined) {
		if (body.ritual_morning_mode !== 'mantra_only' && body.ritual_morning_mode !== 'full')
			throw new ValidationError('ritual_morning_mode', 'Mode inconnu.');
		next.ritual_morning_mode = body.ritual_morning_mode;
	}
	if (body.voice_name !== undefined) {
		if (body.voice_name !== null && (typeof body.voice_name !== 'string' || body.voice_name.length > 200))
			throw new ValidationError('voice_name', 'Voix invalide.');
		next.voice_name = (body.voice_name as string | null) || null;
	}
	if (body.voice_rate !== undefined) {
		const r = body.voice_rate;
		if (typeof r !== 'number' || r < 0.5 || r > 1.5) throw new ValidationError('voice_rate', 'Vitesse entre 0,5 et 1,5.');
		next.voice_rate = Math.round(r * 100) / 100;
	}
	if (body.steps_goal !== undefined) {
		const g = body.steps_goal;
		if (!Number.isInteger(g) || (g as number) < 500 || (g as number) > 100_000)
			throw new ValidationError('steps_goal', 'Objectif entre 500 et 100 000 pas.');
		next.steps_goal = g as number;
	}
	if (next.ritual_evening_end <= next.ritual_evening_start)
		throw new ValidationError('ritual_evening_end', 'La fin du créneau du soir doit suivre son début.');
	if ((next.ritual_morning_until ?? '08:00') <= next.ritual_morning_time)
		throw new ValidationError('ritual_morning_until', 'La fin du matin doit suivre le réveil.');
	db.update(users).set({ settings: next }).where(eq(users.id, userId)).run();
	return next;
}
