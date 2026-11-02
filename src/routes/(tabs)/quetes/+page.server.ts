import { formatDayShort, today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { questOverviews } from '$lib/server/services/quests';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const quests = questOverviews(getDb(), currentUserId(), today()).map((q) => ({
		id: q.id,
		title: q.title,
		lengthDays: q.lengthDays,
		dayNumber: Math.min(q.state.dayNumber, q.lengthDays ?? Infinity),
		held: q.state.held,
		slips: q.state.slips,
		endLabel: q.state.endDay ? formatDayShort(q.state.endDay) : null,
		finished: q.finished
	}));
	return { active: quests.filter((q) => !q.finished), finished: quests.filter((q) => q.finished) };
};
