import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, missionIcs } from '../src/lib/calendar';

const m = { id: 7, title: 'Relancer la RH, avec la date; le montant', rank: 'S', notes: 'Ligne 1\nLigne 2', dueDate: '2026-11-13', plannedDate: null };

describe('agenda export', () => {
	it('builds a valid all-day .ics event', () => {
		const ics = missionIcs(m, new Date('2026-11-02T20:00:00Z'))!;
		expect(ics).toContain('BEGIN:VEVENT');
		expect(ics).toContain('DTSTART;VALUE=DATE:20261113');
		expect(ics).toContain('DTEND;VALUE=DATE:20261114');
		expect(ics).toContain('SUMMARY:Relancer la RH\\, avec la date\; le montant');
		expect(ics).toContain('UID:mission-7@le-dojo');
		expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
	});

	it('uses the planned day when there is no due date, nothing without dates', () => {
		expect(missionIcs({ ...m, dueDate: null, plannedDate: '2026-11-03' })).toContain('20261103');
		expect(missionIcs({ ...m, dueDate: null })).toBeNull();
		expect(googleCalendarUrl({ ...m, dueDate: null })).toBeNull();
	});

	it('builds a Google Calendar link', () => {
		const url = new URL(googleCalendarUrl(m)!);
		expect(url.hostname).toBe('calendar.google.com');
		expect(url.searchParams.get('dates')).toBe('20261113/20261114');
		expect(url.searchParams.get('text')).toBe(m.title);
	});
});
