import { json, type RequestEvent } from '@sveltejs/kit';
import { MISSION_STATUSES, RANKS } from './db/schema';
import { ValidationError } from './services/errors';
import type { MissionInput, MissionPatch } from './services/missions';

type BusinessError = Error & { status: number; code: string; activeTitle?: string; field?: string };
const isBusinessError = (e: unknown): e is BusinessError =>
	e instanceof Error && typeof (e as BusinessError).status === 'number' && typeof (e as BusinessError).code === 'string';

/** Runs an API action and turns business errors into clear JSON responses. */
export async function respond(action: () => unknown | Promise<unknown>): Promise<Response> {
	try {
		const result = await action();
		return json(result ?? { ok: true });
	} catch (e) {
		if (isBusinessError(e)) {
			return json(
				{ code: e.code, message: e.message, activeTitle: e.activeTitle, field: e.field },
				{ status: e.status }
			);
		}
		if (e && typeof e === 'object' && 'status' in e) throw e; // SvelteKit error()/redirect()
		console.error(e);
		return json({ code: 'SERVER', message: 'Erreur inattendue.' }, { status: 500 });
	}
}

export async function readBody(event: RequestEvent): Promise<Record<string, unknown>> {
	try {
		const body: unknown = await event.request.json();
		if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
	} catch {
		/* handled below */
	}
	throw new ValidationError('body', 'Requête invalide.');
}

export function intParam(value: string | undefined, name: string): number {
	const n = Number(value);
	if (!Number.isInteger(n) || n <= 0) throw new ValidationError(name, 'Identifiant invalide.');
	return n;
}

const optional = {
	string(body: Record<string, unknown>, key: string): string | undefined {
		const v = body[key];
		if (v === undefined) return undefined;
		if (typeof v !== 'string') throw new ValidationError(key, 'Texte attendu.');
		return v;
	},
	nullableString(body: Record<string, unknown>, key: string): string | null | undefined {
		const v = body[key];
		if (v === undefined || v === null) return v;
		if (typeof v !== 'string') throw new ValidationError(key, 'Texte attendu.');
		return v.trim() === '' ? null : v;
	},
	nullableInt(body: Record<string, unknown>, key: string): number | null | undefined {
		const v = body[key];
		if (v === undefined || v === null) return v;
		if (!Number.isInteger(v)) throw new ValidationError(key, 'Nombre entier attendu.');
		return v as number;
	},
	oneOf<T extends string>(body: Record<string, unknown>, key: string, values: readonly T[]): T | undefined {
		const v = body[key];
		if (v === undefined) return undefined;
		if (typeof v !== 'string' || !values.includes(v as T)) throw new ValidationError(key, 'Valeur inconnue.');
		return v as T;
	},
	boolean(body: Record<string, unknown>, key: string): boolean | undefined {
		const v = body[key];
		if (v === undefined) return undefined;
		if (typeof v !== 'boolean') throw new ValidationError(key, 'Oui ou non attendu.');
		return v;
	}
};

/** Accepted mission fields (camelCase). Unknown fields are ignored. */
export function parseMissionPatch(body: Record<string, unknown>): MissionPatch {
	const patch: MissionPatch = {
		title: optional.string(body, 'title'),
		rank: optional.oneOf(body, 'rank', RANKS),
		notes: optional.string(body, 'notes'),
		frontId: optional.nullableInt(body, 'frontId'),
		status: optional.oneOf(body, 'status', MISSION_STATUSES),
		dueDate: optional.nullableString(body, 'dueDate'),
		plannedDate: optional.nullableString(body, 'plannedDate'),
		startCondition: optional.nullableString(body, 'startCondition'),
		isTest: optional.boolean(body, 'isTest'),
		reviewDate: optional.nullableString(body, 'reviewDate'),
		parentId: optional.nullableInt(body, 'parentId')
	};
	return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as MissionPatch;
}

export function parseMissionInput(body: Record<string, unknown>): MissionInput {
	const patch = parseMissionPatch(body);
	if (!patch.title) throw new ValidationError('title', 'Le titre est obligatoire.');
	if (!patch.rank) throw new ValidationError('rank', 'Le rang est obligatoire.');
	return { ...patch, title: patch.title, rank: patch.rank, source: 'manual' };
}
