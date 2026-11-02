<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>Moi · {labels.appName}</title></svelte:head>

<h1>Moi</h1>
<a class="btn secondary" href="/moi/bilans">{labels.review.history}</a>

<style>
	h1 { font-size: var(--size-title); margin: var(--gap) 0; }
</style>
