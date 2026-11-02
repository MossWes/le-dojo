<script lang="ts">
	import { goto } from '$app/navigation';
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import SpeakButton from '$lib/components/SpeakButton.svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let message = $state<string | null>(null);
	let busy = $state(false);

	async function said() {
		busy = true;
		const res = await api('POST', '/api/rituals/oath');
		busy = false;
		if (!res.ok) {
			message = res.message;
			return;
		}
		await goto('/', { invalidateAll: true });
	}
</script>

<svelte:head><title>{labels.oath.title} · {labels.appName}</title></svelte:head>

<main>
	<a class="btn link" href="/">← {labels.back}</a>
	<span class="seal"><AdinkraIcon name="fawohodie" size={32} /></span>
	<h1>{labels.oath.title}</h1>
	<ol class="lines">
		{#each data.lines as line, i (i)}<li>{line}</li>{/each}
	</ol>
	{#if message}<p class="notice" role="alert">{message}</p>{/if}
	<div class="row">
		<SpeakButton id="oath" text={data.lines.join(' ')} voice={{ name: data.voiceName, rate: 0.9 }} />
		{#if data.done}
			<p class="meta">{labels.oath.done}</p>
		{:else}
			<button type="button" class="btn primary" disabled={busy} onclick={said}>{labels.oath.said}</button>
		{/if}
	</div>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--gap) var(--gap) calc(var(--gap) * 3);
		min-height: 100dvh;
		background: var(--ink);
	}
	.seal {
		display: block;
		color: var(--gold);
		margin-top: var(--gap);
	}
	h1 {
		font-size: var(--size-title);
		margin: 8px 0 var(--gap);
	}
	.lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.lines li {
		font-size: 19px;
		line-height: 1.45;
		color: var(--parch-bright);
		padding-left: 14px;
		border-left: 1px solid var(--line);
	}
	.lines li:first-child {
		font-style: italic;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: calc(var(--gap) * 1.5);
	}
</style>
