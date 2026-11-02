import { describe, expect, it } from 'vitest';
import { addDays, dayRange, daysBetween, formatDayLong, isDay, timeOfDay, today } from '../src/lib/dates';

describe('dates (Europe/Paris)', () => {
	it('switches day at midnight Paris time, not UTC', () => {
		// 1 Nov 2026 23:30 UTC = 2 Nov 00:30 in Paris (UTC+1).
		expect(today(new Date('2026-11-01T23:30:00Z'))).toBe('2026-11-02');
		expect(today(new Date('2026-11-01T22:59:59Z'))).toBe('2026-11-01');
	});

	it('handles summer time (UTC+2)', () => {
		expect(today(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15');
		expect(timeOfDay(new Date('2026-07-14T18:00:00Z'))).toBe('20:00');
	});

	it('counts days across the October time change', () => {
		expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
		expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
	});

	it('computes ranges and differences', () => {
		expect(daysBetween('2026-09-01', '2026-11-02')).toBe(62);
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(dayRange('2026-11-01', '2026-11-03')).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
		expect(dayRange('2026-11-03', '2026-11-01')).toEqual([]);
	});

	it('validates days', () => {
		expect(isDay('2026-11-02')).toBe(true);
		expect(isDay('2026-02-30')).toBe(false);
		expect(isDay('2-11-2026')).toBe(false);
	});

	it('formats in French', () => {
		expect(formatDayLong('2026-11-02')).toBe('lundi 2 novembre');
	});
});
