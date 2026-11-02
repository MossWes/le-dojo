// Reading of the day (annexe 1, §2). Pure function, deterministic for a given day.
import { daysBetween, type Day } from './dates';

export type PhaseLike = { slug: string; startDate: Day; endDate: Day };
export type ReadingLike = { slug: string; phaseSlug: string | null; order: number | null };

export type DailyReading<R> = {
	reading: R;
	phaseSlug: string;
	/** True when the current phase is missing or has no reading yet ("Phase à mettre à jour"). */
	phaseNeedsUpdate: boolean;
	/** Position in the phase rotation (0-based) and size of the rotation. */
	index: number;
	count: number;
};

/**
 * @param skips how many times "Lecture suivante" was used today.
 */
export function selectDailyReading<R extends ReadingLike>(
	day: Day,
	phases: readonly PhaseLike[],
	allReadings: readonly R[],
	skips = 0
): DailyReading<R> | null {
	const byPhase = (slug: string) =>
		allReadings
			.filter((r) => r.phaseSlug === slug && r.order !== null)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug));

	const current = phases.find((p) => p.startDate <= day && day <= p.endDate);
	let phase = current && byPhase(current.slug).length > 0 ? current : undefined;
	const phaseNeedsUpdate = !phase;

	if (!phase) {
		// Latest phase that has readings, preferring those already started.
		const withReadings = phases
			.filter((p) => byPhase(p.slug).length > 0)
			.sort((a, b) => a.startDate.localeCompare(b.startDate));
		phase = withReadings.filter((p) => p.startDate <= day).at(-1) ?? withReadings[0];
	}
	if (!phase) return null;

	const list = byPhase(phase.slug);
	const count = list.length;
	const base = Math.max(0, daysBetween(phase.startDate, day));
	const index = (((base + skips) % count) + count) % count;
	return { reading: list[index]!, phaseSlug: phase.slug, phaseNeedsUpdate, index, count };
}
