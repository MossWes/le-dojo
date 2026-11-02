import { error } from '@sveltejs/kit';
import { livretCatalogue } from '$lib/server/livrets';
import { currentUserId } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	currentUserId();
	for (const ring of livretCatalogue()) {
		const part = ring.parts.find((p) => p.id === params.id);
		if (part) return { id: part.id, ring: ring.ring, ringName: ring.name, part: part.part, title: part.title };
	}
	error(404, 'Livret introuvable.');
};
