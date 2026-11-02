<script lang="ts">
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import Mantra from '$lib/components/Mantra.svelte';
	import SpeakButton from '$lib/components/SpeakButton.svelte';
	import type { VoicePrefs } from '$lib/client/speech.svelte';
	import { labels } from '$lib/labels';

	let { mantra, voice, onContinue }: { mantra: string; voice: VoicePrefs; onContinue: () => void } = $props();
</script>

<div class="morning" role="dialog" aria-modal="true" aria-label={labels.today.mantra}>
	<div class="inner">
		<span class="seal"><AdinkraIcon name="fawohodie" size={48} /></span>
		<Mantra text={mantra} large />
		<div class="row">
			<SpeakButton id="morning-mantra" text={mantra} {voice} />
			<button type="button" class="btn primary" onclick={onContinue}>{labels.today.morningContinue}</button>
		</div>
	</div>
</div>

<style>
	.morning {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		padding: var(--gap);
		background: var(--ink);
	}
	.inner {
		max-width: 420px;
		width: 100%;
		display: grid;
		gap: calc(var(--gap) * 1.5);
		text-align: center;
	}
	.seal {
		color: var(--gold);
		justify-self: center;
	}
	.row {
		display: flex;
		gap: 10px;
		justify-content: center;
	}
</style>
