<script lang="ts">
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.review;
	const r = $derived(data.review);
</script>

<svelte:head><title>{L.of(data.label)} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/moi/bilans">← {labels.back}</a>
<h1>{L.of(data.label)}</h1>

<dl>
	<dt>{L.q1}</dt>
	<dd>{r.didWell || '—'}</dd>
	<dt>{L.q2a}</dt>
	<dd>{r.missedPrinciple || '—'}</dd>
	<dt>{L.q2b}</dt>
	<dd>{r.fixTomorrow || '—'}</dd>
	<dt>{L.q3}</dt>
	<dd>{r.keptWord ? L.keptWord[r.keptWord] : '—'}</dd>
	{#if r.energy}
		<dt>{L.energy}</dt>
		<dd>{r.energy} / 5</dd>
	{/if}
</dl>

<a class="btn secondary" href="/bilan?day={r.day}">{L.edit}</a>

<style>
	h1 {
		font-size: 22px;
		margin: 8px 0 var(--gap);
	}
	dl {
		margin: 0 0 var(--gap);
	}
	dt {
		font-size: var(--size-small);
		color: var(--gold);
		margin-top: 14px;
	}
	dd {
		margin: 4px 0 0;
		white-space: pre-wrap;
	}
</style>
