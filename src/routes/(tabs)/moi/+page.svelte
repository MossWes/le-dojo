<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>Moi · {labels.appName}</title></svelte:head>

<h1>Moi</h1>
<p class="meta">{labels.comingSoon(7)}</p>

<style>
	h1 { font-size: var(--size-title); margin-top: var(--gap); }
</style>
