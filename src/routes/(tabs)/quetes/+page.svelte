<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>Quêtes · {labels.appName}</title></svelte:head>

<h1>Quêtes</h1>
<p class="meta">{labels.comingSoon(5)}</p>

<style>
	h1 { font-size: var(--size-title); margin-top: var(--gap); }
</style>
