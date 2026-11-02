import serment from '../../../seed/serment.json';
import { today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { userSettings } from '$lib/server/today';
import { and, eq, isNull } from 'drizzle-orm';
import { xpEvents } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const userId = currentUserId();
	const settings = userSettings(db, userId);
	const done = !!db
		.select({ id: xpEvents.id })
		.from(xpEvents)
		.where(and(eq(xpEvents.userId, userId), eq(xpEvents.ritual, 'oath'), eq(xpEvents.day, today()), isNull(xpEvents.revokedAt)))
		.get();
	return { lines: serment.oath, voiceName: settings.voice_name, done };
};
