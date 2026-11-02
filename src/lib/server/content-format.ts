// Validates the phases/readings files (same format as seed/phases.json and seed/readings.json).
import { isDay } from '../dates';
import { PILLARS, SITUATIONS, SYMBOLS, type phases, type readings } from './db/schema';

export type PhaseRow = Omit<typeof phases.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type ReadingRow = Omit<typeof readings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

export class ContentFormatError extends Error {
	constructor(readonly problems: string[]) {
		super(`Fichier invalide :\n- ${problems.join('\n- ')}`);
	}
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(o: Obj, key: string, where: string, problems: string[], optional = false): string {
	const v = o[key];
	if (optional && (v === null || v === undefined)) return '';
	if (typeof v !== 'string' || !v.trim()) problems.push(`${where} : « ${key} » manquant ou vide`);
	return typeof v === 'string' ? v : '';
}

function oneOf<T extends string>(o: Obj, key: string, values: readonly T[], where: string, problems: string[]): T {
	const v = o[key];
	if (typeof v !== 'string' || !values.includes(v as T))
		problems.push(`${where} : « ${key} » doit valoir ${values.join(', ')}`);
	return v as T;
}

export function parseContentFile(data: unknown): { phases: PhaseRow[]; readings: ReadingRow[] } {
	const problems: string[] = [];
	if (!isObj(data)) throw new ContentFormatError(['le fichier doit contenir un objet JSON']);
	if (!('phases' in data) && !('readings' in data))
		throw new ContentFormatError(['le fichier doit contenir « phases » ou « readings »']);
	if ('format_version' in data && data.format_version !== 1)
		problems.push('« format_version » doit valoir 1');

	const phaseRows: PhaseRow[] = [];
	const rawPhases = data.phases ?? [];
	if (!Array.isArray(rawPhases)) problems.push('« phases » doit être une liste');
	else
		rawPhases.forEach((p: unknown, i) => {
			const where = `phase n° ${i + 1}`;
			if (!isObj(p)) return void problems.push(`${where} : objet attendu`);
			const slug = str(p, 'slug', where, problems);
			if (slug && !SLUG.test(slug)) problems.push(`${where} : slug « ${slug} » invalide`);
			const startDate = str(p, 'start_date', where, problems);
			const endDate = str(p, 'end_date', where, problems);
			if (!isDay(startDate) || !isDay(endDate)) problems.push(`${where} : dates au format AAAA-MM-JJ`);
			else if (startDate > endDate) problems.push(`${where} : la fin précède le début`);
			phaseRows.push({
				slug,
				name: str(p, 'name', where, problems),
				startDate,
				endDate,
				description: str(p, 'description', where, problems, true)
			});
		});

	const readingRows: ReadingRow[] = [];
	const rawReadings = data.readings ?? [];
	if (!Array.isArray(rawReadings)) problems.push('« readings » doit être une liste');
	else
		rawReadings.forEach((r: unknown, i) => {
			const where = isObj(r) && typeof r.slug === 'string' ? `lecture « ${r.slug} »` : `lecture n° ${i + 1}`;
			if (!isObj(r)) return void problems.push(`${where} : objet attendu`);
			const slug = str(r, 'slug', where, problems);
			if (slug && !SLUG.test(slug)) problems.push(`${where} : slug invalide`);
			const group = oneOf(r, 'group', ['phase', 'secours'] as const, where, problems);
			const situations = Array.isArray(r.situations) ? r.situations : null;
			if (!situations || situations.some((s) => !SITUATIONS.includes(s)))
				problems.push(`${where} : « situations » doit être une liste parmi ${SITUATIONS.join(', ')}`);
			if (group === 'secours' && situations?.length === 0)
				problems.push(`${where} : une lecture de secours a au moins une situation`);
			let phaseSlug: string | null = null;
			let order: number | null = null;
			if (group === 'phase') {
				phaseSlug = str(r, 'phase_slug', where, problems);
				if (!Number.isInteger(r.order) || (r.order as number) < 1)
					problems.push(`${where} : « order » doit être un entier ≥ 1`);
				order = Number.isInteger(r.order) ? (r.order as number) : null;
			}
			const quote = typeof r.quote === 'string' && r.quote.trim() ? r.quote : null;
			readingRows.push({
				slug,
				group,
				phaseSlug,
				order,
				situations: (situations ?? []) as ReadingRow['situations'],
				pillar: oneOf(r, 'pillar', PILLARS, where, problems),
				source: str(r, 'source', where, problems),
				quote,
				quoteKind: oneOf(r, 'quote_kind', ['citation', 'reformulation'] as const, where, problems),
				title: str(r, 'title', where, problems),
				body: str(r, 'body', where, problems),
				mantra: str(r, 'mantra', where, problems),
				action: str(r, 'action', where, problems),
				eveningQuestion: str(r, 'evening_question', where, problems),
				symbol: oneOf(r, 'symbol', SYMBOLS, where, problems)
			});
		});

	const dup = (rows: { slug: string }[], label: string) => {
		const seen = new Set<string>();
		for (const { slug } of rows) {
			if (seen.has(slug)) problems.push(`${label} « ${slug} » en double`);
			seen.add(slug);
		}
	};
	dup(phaseRows, 'phase');
	dup(readingRows, 'lecture');

	if (problems.length) throw new ContentFormatError(problems);
	return { phases: phaseRows, readings: readingRows };
}
