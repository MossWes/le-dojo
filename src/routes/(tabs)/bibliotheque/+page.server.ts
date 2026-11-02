import { asc } from 'drizzle-orm';
import { formatDayShort, today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { phases, readings, SITUATIONS } from '$lib/server/db/schema';
import { livretCatalogue } from '$lib/server/livrets';
import { userSettings } from '$lib/server/today';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const settings = userSettings(db, currentUserId());
	const day = today();
	const all = db.select().from(readings).orderBy(asc(readings.order), asc(readings.slug)).all();
	const allPhases = db.select().from(phases).orderBy(asc(phases.startDate)).all();
	const current = allPhases.find((p) => p.startDate <= day && day <= p.endDate) ?? null;
	// Current phase first, then the others from the most recent.
	const ordered = [
		...(current ? [current] : []),
		...allPhases.filter((p) => p !== current).reverse()
	];
	return {
		voice: { name: settings.voice_name, rate: settings.voice_rate },
		livrets: livretCatalogue().map((r) => ({
			...r,
			parts: r.parts.map((p) => ({ ...p }))
		})),
		situations: [...SITUATIONS],
		readings: all,
		phases: ordered.map((p) => ({
			slug: p.slug,
			name: p.name,
			current: p === current,
			dates: `${formatDayShort(p.startDate)} → ${formatDayShort(p.endDate)}`,
			readingSlugs: all.filter((r) => r.phaseSlug === p.slug).map((r) => r.slug)
		}))
	};
};
