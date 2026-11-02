// V2 — a dated mission as a calendar event (.ics file, or a Google Calendar link).
import { addDays, type Day } from './dates';

export type CalendarMission = {
	id: number;
	title: string;
	rank: string;
	notes: string;
	dueDate: Day | null;
	plannedDate: Day | null;
};

/** The day used for the event: the due date, otherwise the planned day. */
export function eventDay(m: CalendarMission): Day | null {
	return m.dueDate ?? m.plannedDate;
}

const compact = (day: Day) => day.replace(/-/g, '');

function escapeText(text: string): string {
	return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 lines are folded at 75 octets. */
function fold(line: string): string {
	const bytes = new TextEncoder().encode(line);
	if (bytes.length <= 75) return line;
	const parts: string[] = [];
	let current = '';
	for (const ch of line) {
		if (new TextEncoder().encode(current + ch).length > (parts.length ? 74 : 75)) {
			parts.push(current);
			current = ch;
		} else current += ch;
	}
	parts.push(current);
	return parts.join('\r\n ');
}

function description(m: CalendarMission): string {
	return [`Mission de rang ${m.rank} — Le Dojo`, m.notes.trim()].filter(Boolean).join('\n\n');
}

export function missionIcs(m: CalendarMission, now = new Date()): string | null {
	const day = eventDay(m);
	if (!day) return null;
	const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Le Dojo//FR',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:mission-${m.id}@le-dojo`,
		`DTSTAMP:${stamp}`,
		`DTSTART;VALUE=DATE:${compact(day)}`,
		`DTEND;VALUE=DATE:${compact(addDays(day, 1))}`,
		`SUMMARY:${escapeText(m.title)}`,
		`DESCRIPTION:${escapeText(description(m))}`,
		'TRANSP:TRANSPARENT',
		'END:VEVENT',
		'END:VCALENDAR'
	];
	return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(m: CalendarMission): string | null {
	const day = eventDay(m);
	if (!day) return null;
	const q = new URLSearchParams({
		action: 'TEMPLATE',
		text: m.title,
		dates: `${compact(day)}/${compact(addDays(day, 1))}`,
		details: description(m)
	});
	return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
