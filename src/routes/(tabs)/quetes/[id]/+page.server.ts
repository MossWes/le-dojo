import { error } from '@sveltejs/kit';
import { formatDayLong, formatDayShort, today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { questOverviews } from '$lib/server/services/quests';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const day = today();
	const quest = questOverviews(getDb(), currentUserId(), day).find((q) => q.id === Number(params.id));
	if (!quest) error(404, 'Quête introuvable.');
	return {
		day,
		quest: {
			id: quest.id,
			title: quest.title,
			kind: quest.kind,
			lengthDays: quest.lengthDays,
			milestones: quest.milestones,
			state: quest.state,
			finished: quest.finished,
			endLabel: quest.state.endDay ? formatDayShort(quest.state.endDay) : null,
			calendar: quest.calendar.map((c) => ({ ...c, label: formatDayLong(c.day) }))
		}
	};
};
