/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Offline reading (V1): the app shell is cached at install; pages, data and booklets
// are cached the first time they are viewed (network first, cache when offline).
// Writes always need the network: the app says so clearly.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const SHELL = `shell-${version}`;
const DATA = 'data-v1';
const SHELL_FILES = new Set([...build, ...files]);
const NEVER_CACHE = ['/api/auth/', '/api/export', '/api/health', '/api/integrations/'];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(SHELL)
			.then((cache) => cache.addAll([...SHELL_FILES]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

// SvelteKit adds a changing parameter to data requests: ignore it for the cache key.
function cacheKey(url: URL): string {
	const u = new URL(url);
	u.searchParams.delete('x-sveltekit-invalidated');
	return u.href;
}

const OFFLINE_PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Le Dojo</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#15110d;color:#ecdfc3;font-family:Georgia,serif;text-align:center;padding:24px">
<div><p style="font-size:20px">Pas de réseau.</p><p style="color:#c9b993">Cette page n’a pas encore été ouverte sur cet appareil.<br>Je peux revenir à <a style="color:#f3dca6" href="/">Aujourd’hui</a>.</p></div></body></html>`;

sw.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;
	if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return;

	if (SHELL_FILES.has(url.pathname)) {
		event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
		return;
	}

	event.respondWith(
		(async () => {
			const key = cacheKey(url);
			try {
				const response = await fetch(request);
				if (response.ok && !response.redirected && response.type === 'basic') {
					const copy = response.clone();
					caches.open(DATA).then((cache) => cache.put(key, copy));
				}
				return response;
			} catch {
				const cached = await caches.match(key, { cacheName: DATA });
				if (cached) return cached;
				if (request.mode === 'navigate') {
					return new Response(OFFLINE_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });
				}
				return new Response(JSON.stringify({ code: 'OFFLINE', message: 'Pas de réseau.' }), {
					status: 503,
					headers: { 'content-type': 'application/json' }
				});
			}
		})()
	);
});
