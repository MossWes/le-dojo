<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>Bibliothèque · {labels.appName}</title></svelte:head>

<h1>Bibliothèque</h1>
<p class="meta">{labels.comingSoon(6)}</p>

<style>
	h1 { font-size: var(--size-title); margin-top: var(--gap); }
</style>
