<script lang="ts">
	import '@fontsource/lora/400.css';
	import '@fontsource/lora/600.css';
	import '@fontsource/lora/400-italic.css';
	import '$lib/styles/base.css';
	import { onMount } from 'svelte';
	import { labels } from '$lib/labels';
	import { queue } from '$lib/client/queue.svelte';

	let { children } = $props();
	let offline = $state(false);

	onMount(() => {
		queue.init();
		const update = () => (offline = !navigator.onLine);
		update();
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});
</script>

{#if offline}
	<p class="offline" role="status">
		{labels.queue.offline}{#if queue.items.length}{' '}{labels.queue.count(queue.items.length)}{/if}
	</p>
{:else if queue.items.length}
	<p class="offline" role="status">{labels.queue.sending(queue.items.length)}</p>
{/if}
{#if queue.problems.length}
	<div class="offline problems" role="alert">
		{#each queue.problems as p, i (i)}<p>{p}</p>{/each}
		<button type="button" class="btn link" onclick={() => queue.dismissProblems()}>{labels.queue.dismiss}</button>
	</div>
{/if}
{@render children()}

<style>
	.offline {
		position: sticky;
		top: 0;
		z-index: 40;
		margin: 0;
		padding: calc(env(safe-area-inset-top) + 8px) 16px 8px;
		background: var(--ink-sunken);
		border-bottom: 1px solid var(--line);
		color: var(--parch-soft);
		font-size: var(--size-small);
		text-align: center;
	}
	.problems p {
		margin: 0 0 4px;
	}
</style>
