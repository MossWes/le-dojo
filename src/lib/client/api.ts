import { labels } from '$lib/labels';
import { queue } from './queue.svelte';

export type ApiResult<T> = { ok: true; data: T; queued?: false } | { ok: false; message: string; code?: string };
export type QueuedResult<T> = ApiResult<T> | { ok: true; data: null; queued: true };

type Options = {
	/** Without network, keep the action on this device and send it later (V2 offline queue). */
	queueKey?: string;
};

/** Calls the API. Never throws: returns a French message on failure. */
export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>>;
export async function api<T = unknown>(
	method: string,
	url: string,
	body: unknown,
	options: { queueKey: string }
): Promise<QueuedResult<T>>;
export async function api<T = unknown>(
	method: string,
	url: string,
	body?: unknown,
	options: Options = {}
): Promise<QueuedResult<T>> {
	const offline = () => {
		if (options.queueKey) {
			queue.add({ key: options.queueKey, method, url, body: body ?? null });
			return { ok: true, data: null, queued: true } as const;
		}
		return { ok: false, message: labels.errors.offline, code: 'OFFLINE' } as const;
	};
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return offline();
	try {
		const res = await fetch(url, {
			method,
			headers: body === undefined ? undefined : { 'content-type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		const data = await res.json().catch(() => null);
		if (res.ok) return { ok: true, data: data as T };
		if (res.status === 503 && data?.code === 'OFFLINE') return offline();
		return { ok: false, message: data?.message ?? labels.errors.generic, code: data?.code };
	} catch {
		return offline();
	}
}
