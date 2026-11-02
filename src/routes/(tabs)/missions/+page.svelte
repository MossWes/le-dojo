<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>Missions · {labels.appName}</title></svelte:head>

<h1>Missions</h1>
<p class="meta">{labels.comingSoon(4)}</p>

<style>
	h1 { font-size: var(--size-title); margin-top: var(--gap); }
</style>
