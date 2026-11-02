<script lang="ts">
	import '@fontsource/lora/400.css';
	import '@fontsource/lora/600.css';
	import '@fontsource/lora/400-italic.css';
	import '$lib/styles/base.css';
	import { onMount } from 'svelte';
	import { labels } from '$lib/labels';

	let { children } = $props();
	let offline = $state(false);

	onMount(() => {
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
	<p class="offline" role="status">{labels.errors.offline}</p>
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
</style>
