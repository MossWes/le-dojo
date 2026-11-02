import { error } from '@sveltejs/kit';
import { today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { missionView } from '$lib/server/mission-view';
import { NotFoundError } from '$lib/server/services/errors';
import { listFronts } from '$lib/server/services/fronts';
import { getMission, subMissions } from '$lib/server/services/missions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const db = getDb();
	const userId = currentUserId();
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404, 'Mission introuvable.');
	try {
		const mission = getMission(db, userId, id);
		const fronts = listFronts(db, userId);
		const frontNames = new Map(fronts.map((f) => [f.id, f.name]));
		const day = today();
		const parent = mission.parentId ? getMission(db, userId, mission.parentId) : null;
		return {
			mission,
			view: missionView(mission, day, frontNames),
			parent: parent ? { id: parent.id, title: parent.title } : null,
			subs: subMissions(db, userId, id).map((m) => missionView(m, day, frontNames)),
			fronts
		};
	} catch (e) {
		if (e instanceof NotFoundError) error(404, 'Mission introuvable.');
		throw e;
	}
};
