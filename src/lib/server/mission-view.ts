import { formatDayShort, type Day } from '../dates';
import type { Mission } from './services/missions';

export type MissionView = {
	id: number;
	title: string;
	rank: Mission['rank'];
	status: Mission['status'];
	done: boolean;
	active: boolean;
	front: string | null;
	frontId: number | null;
	dueDate: Day | null;
	dueLabel: string | null;
	overdue: boolean;
	isTest: boolean;
	reviewLabel: string | null;
	testReview: boolean;
	startCondition: string | null;
	parentId: number | null;
	parentTitle: string | null;
};

/** What the screens need to display a mission (no internal fields). */
export function missionView(
	m: Mission,
	day: Day,
	frontNames: ReadonlyMap<number, string>,
	titles: ReadonlyMap<number, string> = new Map()
): MissionView {
	const active = m.status === 'todo' || m.status === 'doing';
	return {
		id: m.id,
		title: m.title,
		rank: m.rank,
		status: m.status,
		done: m.status === 'done',
		active,
		front: m.frontId ? (frontNames.get(m.frontId) ?? null) : null,
		frontId: m.frontId,
		dueDate: m.dueDate,
		dueLabel: m.dueDate ? formatDayShort(m.dueDate) : null,
		overdue: active && !!m.dueDate && m.dueDate < day,
		isTest: m.isTest,
		reviewLabel: m.reviewDate ? formatDayShort(m.reviewDate) : null,
		testReview: m.isTest && active && m.reviewDate !== null && m.reviewDate <= day,
		startCondition: m.startCondition,
		parentId: m.parentId,
		parentTitle: m.parentId ? (titles.get(m.parentId) ?? null) : null
	};
}
