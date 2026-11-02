<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import ReadingSheet from '$lib/components/library/ReadingSheet.svelte';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.library;

	const bySlug = $derived(new Map(data.readings.map((r) => [r.slug, r])));
	const shown = $derived(page.state.reading ? bySlug.get(page.state.reading) : undefined);
	const situation = $derived(page.state.situation ?? null);

	function open(slug: string, fromSituation: string | null = null) {
		pushState('', { reading: slug, situation: fromSituation ?? undefined });
	}

	function close() {
		history.back();
	}

	// Random secours reading for a situation (another one than the current if possible).
	function pickSecours(tag: string, avoid?: string) {
		const pool = data.readings.filter((r) => r.group === 'secours' && r.situations.includes(tag as never));
		const choices = pool.length > 1 ? pool.filter((r) => r.slug !== avoid) : pool;
		const pick = choices[Math.floor(Math.random() * choices.length)];
		return pick?.slug;
	}

	function openSecours(tag: string) {
		const slug = pickSecours(tag);
		if (slug) open(slug, tag);
	}

	function another() {
		if (!situation || !shown) return;
		const slug = pickSecours(situation, shown.slug);
		if (slug) pushState('', { reading: slug, situation }); // keeps "back" simple: one step per reading
	}

	// Download the booklets once so they open without network later.
	onMount(() => {
		if (!navigator.onLine || !('caches' in window)) return;
		for (const ring of data.livrets) for (const p of ring.parts) fetch(`/livrets/${encodeURIComponent(p.id)}`).catch(() => {});
	});
</script>

<svelte:head><title>{L.title} · {labels.appName}</title></svelte:head>

<h1>{L.title}</h1>

<section class="section">
	<span class="overline">{L.secours}</span>
	<div class="secours">
		{#each data.situations as s (s)}
			<button type="button" class="btn secondary" onclick={() => openSecours(s)}>{L.situations[s]}</button>
		{/each}
	</div>
</section>

<section class="section">
	<span class="overline">{L.livrets}</span>
	<ul class="livrets">
		{#each data.livrets as ring (ring.ring)}
			<li class:empty={ring.parts.length === 0}>
				<span class="symbol"><AdinkraIcon name={ring.symbol} size={32} /></span>
				<div class="info">
					<span class="ring">{L.ring(ring.ring, ring.name)}</span>
					{#if ring.parts.length === 0}
						<span class="meta">{L.comingSoon}</span>
					{:else}
						{#each ring.parts as p (p.id)}
							<a href="/bibliotheque/livrets/{encodeURIComponent(p.id)}">{L.part(p.part, p.title)}</a>
						{/each}
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</section>

{#each data.phases as phase (phase.slug)}
	{#if phase.readingSlugs.length}
		<section class="section">
			<span class="overline">{L.readings} · {phase.name}{#if phase.current}{' · '}{L.currentPhase}{/if}</span>
			<p class="meta dates">{phase.dates}</p>
			<ul class="readings">
				{#each phase.readingSlugs as slug (slug)}
					{@const r = bySlug.get(slug)}
					{#if r}
						<li>
							<button type="button" onclick={() => open(slug)}>
								<span class="num">{r.order}</span>
								<span class="text"><span class="title">{r.title}</span><span class="meta">{labels.pillars[r.pillar]}</span></span>
							</button>
						</li>
					{/if}
				{/each}
			</ul>
		</section>
	{/if}
{/each}

<p class="meta credit">{labels.adinkraCredit}</p>

{#if shown}
	<ReadingSheet reading={shown} voice={data.voice} onclose={close} onother={situation ? another : undefined} />
{/if}

<style>
	h1 {
		font-size: var(--size-title);
		padding-top: var(--gap);
	}
	.secours {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	.secours .btn {
		min-height: 56px;
		font-size: var(--size-body);
	}
	.livrets,
	.readings {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.livrets li {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		padding: 12px 0;
		border-bottom: 1px solid var(--line-soft);
	}
	.livrets .symbol {
		color: var(--gold);
	}
	.livrets .empty .symbol {
		color: var(--dim);
		opacity: 0.6;
	}
	.info {
		display: grid;
		gap: 4px;
	}
	.ring {
		font-weight: 600;
	}
	.empty .ring {
		color: var(--parch-soft);
	}
	.info a {
		min-height: 32px;
		display: inline-flex;
		align-items: center;
	}
	.dates {
		margin: -6px 0 6px;
	}
	.readings button {
		width: 100%;
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 10px 0;
		background: none;
		border: 0;
		border-bottom: 1px solid var(--line-soft);
		color: var(--parch);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.num {
		width: 24px;
		color: var(--gold);
		font-size: var(--size-small);
		text-align: right;
	}
	.text {
		display: grid;
	}
	.credit {
		margin-top: calc(var(--gap) * 2);
		text-align: center;
	}
</style>
