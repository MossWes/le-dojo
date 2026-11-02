import { labels } from '$lib/labels';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string; code?: string };

/** Calls the API. Never throws: returns a French message on failure. */
export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
	if (typeof navigator !== 'undefined' && navigator.onLine === false)
		return { ok: false, message: labels.errors.offline, code: 'OFFLINE' };
	try {
		const res = await fetch(url, {
			method,
			headers: body === undefined ? undefined : { 'content-type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		const data = await res.json().catch(() => null);
		if (res.ok) return { ok: true, data: data as T };
		return { ok: false, message: data?.message ?? labels.errors.generic, code: data?.code };
	} catch {
		return { ok: false, message: labels.errors.offline, code: 'OFFLINE' };
	}
}
