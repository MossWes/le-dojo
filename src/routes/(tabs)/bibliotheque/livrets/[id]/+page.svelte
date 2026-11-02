<script lang="ts">
	import { onMount } from 'svelte';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.library;

	let container: HTMLDivElement;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let pageCount = $state(0);

	onMount(() => {
		let cancelled = false;
		let destroy: (() => void) | undefined;
		(async () => {
			try {
				// pdf.js is loaded only here, and served by the app (no CDN).
				const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
				const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
				pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
				// Fetched by the page itself so the offline cache (service worker) is used.
				const response = await fetch(`/livrets/${encodeURIComponent(data.id)}`);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const bytes = new Uint8Array(await response.arrayBuffer());
				const doc = await pdfjs.getDocument({
					data: bytes,
					isEvalSupported: false,
					useSystemFonts: false
				}).promise;
				destroy = () => doc.destroy();
				if (cancelled) return;
				pageCount = doc.numPages;
				status = 'ready';
				const width = container.clientWidth;
				const ratio = Math.min(window.devicePixelRatio || 1, 3);
				for (let n = 1; n <= doc.numPages && !cancelled; n++) {
					const pdfPage = await doc.getPage(n);
					const base = pdfPage.getViewport({ scale: 1 });
					const viewport = pdfPage.getViewport({ scale: (width / base.width) * ratio });
					const canvas = document.createElement('canvas');
					canvas.width = Math.floor(viewport.width);
					canvas.height = Math.floor(viewport.height);
					canvas.setAttribute('aria-label', L.page(n, doc.numPages));
					canvas.setAttribute('role', 'img');
					container.appendChild(canvas);
					await pdfPage.render({ canvas, viewport }).promise;
				}
			} catch (e) {
				console.error(e);
				if (!cancelled) status = 'error';
			}
		})();
		return () => {
			cancelled = true;
			destroy?.();
		};
	});
</script>

<svelte:head><title>{data.title} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/bibliotheque">← {labels.back}</a>
<p class="overline">{L.ring(data.ring, data.ringName)}</p>
<h1>{L.part(data.part, data.title)}</h1>

{#if status === 'loading'}<p class="meta">{L.loading}</p>{/if}
{#if status === 'error'}<p class="notice" role="alert">{L.loadError}</p>{/if}
{#if status === 'ready'}<p class="meta">{pageCount} pages</p>{/if}

<div class="pages" bind:this={container}></div>

<style>
	h1 {
		font-size: 22px;
		margin: 4px 0 8px;
	}
	.pages {
		display: grid;
		gap: 12px;
		margin-top: var(--gap);
	}
	.pages :global(canvas) {
		width: 100%;
		height: auto;
		border: 1px solid var(--line-soft);
	}
</style>
