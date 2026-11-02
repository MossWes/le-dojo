<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { speech, type VoicePrefs } from '$lib/client/speech.svelte';
	import { labels } from '$lib/labels';
	import { onDestroy } from 'svelte';

	let {
		id,
		text,
		voice,
		onEnd
	}: { id: string; text: string; voice: VoicePrefs; onEnd?: () => void } = $props();

	const mine = $derived(speech.owner === id);
	const label = $derived(
		mine && speech.state === 'speaking'
			? labels.today.pause
			: mine && speech.state === 'paused'
				? labels.today.resume
				: labels.today.listen
	);

	function toggle() {
		if (mine && speech.state === 'speaking') speech.pause();
		else if (mine && speech.state === 'paused') speech.resume();
		else speech.speak(id, text, voice, onEnd);
	}

	onDestroy(() => {
		if (speech.owner === id) speech.stop();
	});
</script>

<button type="button" class="btn secondary" onclick={toggle} aria-pressed={mine && speech.state === 'speaking'}>
	{#if mine && speech.state === 'speaking'}<Pause size={18} />{:else}<Play size={18} />{/if}
	{label}
</button>
