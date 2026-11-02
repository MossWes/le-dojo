import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { listFronts } from '$lib/server/services/fronts';
import { getMission } from '$lib/server/services/missions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const userId = currentUserId();
	const parentId = Number(url.searchParams.get('parent'));
	const parent = Number.isInteger(parentId) && parentId > 0 ? getMissionOrNull(parentId) : null;
	function getMissionOrNull(id: number) {
		try {
			const m = getMission(db, userId, id);
			return m.parentId === null ? { id: m.id, title: m.title, frontId: m.frontId } : null;
		} catch {
			return null;
		}
	}
	return { fronts: listFronts(db, userId), parent };
};
