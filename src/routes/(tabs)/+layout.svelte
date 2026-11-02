<script lang="ts">
	import TabBar from '$lib/components/TabBar.svelte';
	let { children } = $props();
</script>

<div class="page">
	{@render children()}
</div>
<TabBar />

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--gap) var(--gap) calc(88px + env(safe-area-inset-bottom));
	}
</style>
