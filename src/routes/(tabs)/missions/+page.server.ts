import { today } from '$lib/dates';
import { parseMissionFilters } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { missions } from '$lib/server/db/schema';
import { missionView } from '$lib/server/mission-view';
import { listFronts } from '$lib/server/services/fronts';
import { listMissions } from '$lib/server/services/missions';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const userId = currentUserId();
	const filters = parseMissionFilters(url.searchParams);
	const fronts = listFronts(db, userId);
	const frontNames = new Map(fronts.map((f) => [f.id, f.name]));
	const titles = new Map(
		db.select({ id: missions.id, title: missions.title }).from(missions).where(eq(missions.userId, userId)).all().map((m) => [m.id, m.title])
	);
	const day = today();
	return {
		filters: { view: filters.view ?? 'todo', rank: filters.rank ?? null, frontId: filters.frontId ?? null },
		fronts,
		missions: listMissions(db, userId, filters).map((m) => missionView(m, day, frontNames, titles))
	};
};
