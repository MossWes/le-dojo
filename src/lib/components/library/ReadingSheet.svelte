<script lang="ts">
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import Mantra from '$lib/components/Mantra.svelte';
	import SpeakButton from '$lib/components/SpeakButton.svelte';
	import type { VoicePrefs } from '$lib/client/speech.svelte';
	import { labels } from '$lib/labels';
	import type { AdinkraName } from '$lib/icons';
	import type { Reading } from '$lib/server/services/readings';

	type Props = { reading: Reading; voice: VoicePrefs; onclose: () => void; onother?: () => void };
	let { reading: r, voice, onclose, onother }: Props = $props();
	const L = labels.library;
</script>

<div class="sheet" role="dialog" aria-modal="true" aria-label={r.title}>
	<div class="inner">
		<button type="button" class="btn link" onclick={onclose}>← {L.close}</button>
		<article class="card">
			<header>
				<p class="overline">{labels.pillars[r.pillar] ?? r.pillar} · {r.source}</p>
				<span class="symbol"><AdinkraIcon name={r.symbol as AdinkraName} size={24} /></span>
			</header>
			<h2>{r.title}</h2>
			{#if r.quote}<blockquote class="quote">{r.quote}</blockquote>{/if}
			<p>{r.body}</p>
			<Mantra text={r.mantra} />
			<p class="overline section-label">{labels.today.action}</p>
			<p>{r.action}</p>
			<p class="overline section-label">{L.eveningQuestion}</p>
			<p class="question">{r.eveningQuestion}</p>
			<div class="row">
				<SpeakButton id="sheet-{r.id}" text={`${r.title}. ${r.body} Mantra : ${r.mantra}`} {voice} />
				{#if onother}<button type="button" class="btn secondary" onclick={onother}>{L.otherReading}</button>{/if}
			</div>
		</article>
	</div>
</div>

<style>
	.sheet {
		position: fixed;
		inset: 0;
		z-index: 30;
		overflow-y: auto;
		background: var(--ink);
		padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
	}
	.inner {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--gap);
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	header .overline {
		margin: 0;
	}
	.symbol {
		color: var(--gold);
	}
	h2 {
		font-size: 22px;
		margin: 8px 0 12px;
	}
	.quote {
		margin: 0 0 12px;
		padding-left: 12px;
		border-left: 1px solid var(--line);
		font-style: italic;
		color: var(--parch-soft);
	}
	.section-label {
		margin: var(--gap) 0 4px;
	}
	.question {
		font-style: italic;
		color: var(--parch-soft);
	}
	.row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: var(--gap);
	}
</style>
