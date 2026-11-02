<script lang="ts">
	import { labels } from '$lib/labels';
</script>

<svelte:head><title>{labels.today.myReview} · {labels.appName}</title></svelte:head>

<main>
	<a class="btn link" href="/">← {labels.back}</a>
	<h1>{labels.today.myReview}</h1>
	<p class="meta">{labels.comingSoon(5)}</p>
</main>

<style>
	main { max-width: 480px; margin: 0 auto; padding: var(--gap); }
	h1 { font-size: var(--size-title); margin-top: var(--gap); }
</style>
