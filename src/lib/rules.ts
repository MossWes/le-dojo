// Game rules (brief part 5). Values come from seed/grades.json, the single source.
import gradesFile from '../../seed/grades.json';
import { addDays, daysBetween, type Day } from './dates';
import type { Milestone, Rank, Ritual } from './server/db/schema';

export type Grade = { name: string; min_xp: number };

export const GRADES: readonly Grade[] = [...gradesFile.grades].sort((a, b) => a.min_xp - b.min_xp);
export const XP_BY_RANK: Readonly<Record<Rank, number>> = gradesFile.xp_by_rank;
export const XP_BY_RITUAL: Readonly<Record<Ritual, number>> = gradesFile.xp_rituals;
export const QUEST_DEFAULTS = gradesFile.quest_defaults;
export const RANK_ORDER: readonly Rank[] = ['S', 'A', 'B', 'C', 'D'];

export type GradeProgress = {
	grade: Grade;
	next: Grade | null;
	/** XP earned since the current grade. */
	xpInGrade: number;
	/** XP needed between the current and next grade (null at the last grade). */
	xpToNext: number | null;
	/** 0 → 1 */
	progress: number;
};

export function gradeFor(totalXp: number): GradeProgress {
	const xp = Math.max(0, totalXp);
	let index = 0;
	GRADES.forEach((g, i) => {
		if (xp >= g.min_xp) index = i;
	});
	const grade = GRADES[index]!;
	const next = GRADES[index + 1] ?? null;
	const xpInGrade = xp - grade.min_xp;
	const xpToNext = next ? next.min_xp - grade.min_xp : null;
	return { grade, next, xpInGrade, xpToNext, progress: xpToNext ? xpInGrade / xpToNext : 1 };
}

/** Day number of a quest: start day = 1. */
export function questDayNumber(startDate: Day, day: Day): number {
	return daysBetween(startDate, day) + 1;
}

/** Last day of a quest, or null for an endless quest. */
export function questEndDay(startDate: Day, lengthDays: number | null): Day | null {
	return lengthDays === null ? null : addDays(startDate, lengthDays - 1);
}

export function milestoneOn(milestones: readonly Milestone[], dayNumber: number): Milestone | null {
	return milestones.find((m) => m.day === dayNumber) ?? null;
}

export function compareRanks(a: Rank, b: Rank): number {
	return RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b);
}
