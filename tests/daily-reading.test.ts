import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { addDays } from '../src/lib/dates';
import { selectDailyReading, type PhaseLike, type ReadingLike } from '../src/lib/daily-reading';

type RawPhase = { slug: string; start_date: string; end_date: string };
type RawReading = { slug: string; phase_slug?: string | null; order?: number | null };
const phasesFile: { phases: RawPhase[] } = JSON.parse(readFileSync('seed/phases.json', 'utf8'));
const readingsFile: { readings: RawReading[] } = JSON.parse(readFileSync('seed/readings.json', 'utf8'));
const phases: PhaseLike[] = phasesFile.phases.map((p) => ({
	slug: p.slug,
	startDate: p.start_date,
	endDate: p.end_date
}));
const readings: ReadingLike[] = readingsFile.readings.map((r) => ({
	slug: r.slug,
	phaseSlug: r.phase_slug ?? null,
	order: r.order ?? null
}));

describe('reading of the day', () => {
	it('starts the phase with its first reading', () => {
		const r = selectDailyReading('2026-11-02', phases, readings);
		expect(r?.reading.slug).toBe('neg-01-ce-qui-depend');
		expect(r?.phaseNeedsUpdate).toBe(false);
	});

	it('is the same all day long (pure and deterministic)', () => {
		expect(selectDailyReading('2026-11-05', phases, readings)).toEqual(
			selectDailyReading('2026-11-05', phases, readings)
		);
	});

	it('never repeats before the phase has been fully read', () => {
		const slugs = Array.from({ length: 12 }, (_, i) =>
			selectDailyReading(addDays('2026-11-02', i), phases, readings)!.reading.slug
		);
		expect(new Set(slugs).size).toBe(12);
		expect(slugs).toEqual([...slugs].sort());
	});

	it('ignores secours readings', () => {
		for (let i = 0; i < 14; i++) {
			const r = selectDailyReading(addDays('2026-11-02', i), phases, readings);
			expect(r?.reading.slug.startsWith('neg-')).toBe(true);
		}
	});

	it('falls back to the last phase with readings and flags it', () => {
		// "Préparation" starts on 16 Nov and has no reading yet.
		const r = selectDailyReading('2026-11-16', phases, readings);
		expect(r?.phaseSlug).toBe('negociation');
		expect(r?.phaseNeedsUpdate).toBe(true);
		// The rotation continues where it was: 14 days after the start → index 2.
		expect(r?.reading.slug).toBe('neg-03-rien-inutile');
	});

	it('falls back when no phase covers the day', () => {
		const r = selectDailyReading('2027-02-01', phases, readings);
		expect(r?.phaseSlug).toBe('negociation');
		expect(r?.phaseNeedsUpdate).toBe(true);
	});

	it('"Lecture suivante" moves to the next one in order, and wraps', () => {
		expect(selectDailyReading('2026-11-02', phases, readings, 1)?.reading.slug).toBe('neg-02-preparer-terrain');
		expect(selectDailyReading('2026-11-13', phases, readings, 1)?.reading.slug).toBe('neg-01-ce-qui-depend');
	});

	it('returns null without any reading', () => {
		expect(selectDailyReading('2026-11-02', phases, [])).toBeNull();
	});
});
