<script lang="ts">
	import { onMount } from 'svelte';
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import Mantra from '$lib/components/Mantra.svelte';
	import SpeakButton from '$lib/components/SpeakButton.svelte';
	import { api } from '$lib/client/api';
	import type { VoicePrefs } from '$lib/client/speech.svelte';
	import { labels } from '$lib/labels';
	import type { AdinkraName } from '$lib/icons';
	import type { TodayData } from '$lib/server/today';

	type Props = {
		data: NonNullable<TodayData['reading']>;
		ritualDone: boolean;
		voice: VoicePrefs;
		onChanged: () => Promise<void>;
		notify: (message: string) => void;
	};
	let { data, ritualDone, voice, onChanged, notify }: Props = $props();

	const r = $derived(data.reading);
	let quoteOpen = $state(false);
	let addedToMissions = $state(false);
	let busy = $state(false);
	const longQuote = $derived((r.quote?.length ?? 0) > 220);
	const listenText = $derived(`${r.title}. ${r.body} Mantra : ${r.mantra}`);

	async function markSeen(listened: boolean) {
		if (ritualDone && !listened) return;
		const res = await api('POST', `/api/readings/${r.id}/view`, { listened });
		if (res.ok) await onChanged();
	}

	async function next() {
		busy = true;
		const res = await api('POST', '/api/today/next-reading');
		busy = false;
		quoteOpen = false;
		addedToMissions = false;
		if (!res.ok) return notify(res.message);
		await onChanged();
	}

	async function toMission() {
		busy = true;
		const res = await api('POST', `/api/readings/${r.id}/to-mission`);
		busy = false;
		if (!res.ok) return notify(res.message);
		addedToMissions = true;
		await onChanged();
	}

	// The reading ritual is validated after 10 seconds with the card open.
	onMount(() => {
		if (ritualDone) return;
		let elapsed = 0;
		const timer = setInterval(() => {
			if (document.visibilityState !== 'visible') return;
			elapsed += 1;
			if (elapsed >= 10) {
				clearInterval(timer);
				markSeen(false);
			}
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<article class="card reading">
	<header>
		<p class="overline">{labels.pillars[r.pillar] ?? r.pillar} · {r.source}</p>
		<span class="symbol"><AdinkraIcon name={r.symbol as AdinkraName} size={24} /></span>
	</header>
	<h2>{r.title}</h2>

	{#if r.quote}
		<blockquote class="quote" class:clamped={longQuote && !quoteOpen}>{r.quote}</blockquote>
		{#if longQuote}
			<button type="button" class="btn link" onclick={() => (quoteOpen = !quoteOpen)}>
				{quoteOpen ? labels.today.readLess : labels.today.readMore}
			</button>
		{/if}
	{/if}

	<p class="body">{r.body}</p>

	<Mantra text={r.mantra} />

	<div class="action">
		<p class="overline">{labels.today.action}</p>
		<p>{r.action}</p>
		{#if addedToMissions}
			<p class="meta">{labels.today.addedToMissions}</p>
		{:else}
			<button type="button" class="btn secondary" disabled={busy} onclick={toMission}>{labels.today.toMission}</button>
		{/if}
	</div>

	<div class="buttons">
		<SpeakButton id="reading-{r.id}" text={listenText} {voice} onEnd={() => markSeen(true)} />
		<button type="button" class="btn secondary" disabled={busy} onclick={next}>{labels.today.nextReading}</button>
	</div>

	<p class="meta foot">
		{data.position} / {data.count}{#if data.phaseNeedsUpdate}{' · '}{labels.today.phaseToUpdate}{/if}
	</p>
</article>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}
	header .overline {
		margin: 0;
	}
	.symbol {
		color: var(--gold);
		flex: none;
	}
	h2 {
		font-size: 22px;
		margin: 8px 0 12px;
	}
	.quote {
		margin: 0;
		padding-left: 12px;
		border-left: 1px solid var(--line);
		font-style: italic;
		color: var(--parch-soft);
	}
	.quote.clamped {
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.body {
		margin: 12px 0 16px;
	}
	.action {
		margin-top: var(--gap);
	}
	.action p {
		margin: 0 0 8px;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: var(--gap);
	}
	.foot {
		margin: 12px 0 0;
	}
</style>
