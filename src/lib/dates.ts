// The single place for date logic. Every "day" is a 'YYYY-MM-DD' string in Europe/Paris.

export const TIMEZONE = 'Europe/Paris';
export type Day = string;

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIMEZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

function parisParts(now: Date): Record<string, string> {
	return Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
}

/** Today's date in Paris. */
export function today(now: Date = new Date()): Day {
	const p = parisParts(now);
	return `${p.year}-${p.month}-${p.day}`;
}

/** Current Paris time as 'HH:MM'. */
export function timeOfDay(now: Date = new Date()): string {
	const p = parisParts(now);
	return `${p.hour}:${p.minute}`;
}

function toUtcMs(day: Day): number {
	const m = DAY_PATTERN.exec(day);
	if (!m) throw new Error(`Invalid day: ${day}`);
	return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function fromUtcMs(ms: number): Day {
	return new Date(ms).toISOString().slice(0, 10);
}

export function isDay(value: unknown): value is Day {
	if (typeof value !== 'string' || !DAY_PATTERN.test(value)) return false;
	return fromUtcMs(toUtcMs(value)) === value;
}

/** Number of calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Day, to: Day): number {
	return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function addDays(day: Day, n: number): Day {
	return fromUtcMs(toUtcMs(day) + n * DAY_MS);
}

/** Every day from `from` to `to`, both included. */
export function dayRange(from: Day, to: Day): Day[] {
	const count = daysBetween(from, to);
	return Array.from({ length: Math.max(0, count + 1) }, (_, i) => addDays(from, i));
}

const longFormatter = new Intl.DateTimeFormat('fr-FR', {
	timeZone: 'UTC',
	weekday: 'long',
	day: 'numeric',
	month: 'long'
});

/** 'lundi 2 novembre' */
export function formatDayLong(day: Day): string {
	return longFormatter.format(new Date(toUtcMs(day)));
}

export function nowIso(now: Date = new Date()): string {
	return now.toISOString();
}
