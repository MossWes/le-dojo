<script lang="ts">
	import { page } from '$app/state';
	import { labels } from '$lib/labels';

	const message = $derived(
		page.status === 404
			? labels.errors.notFound
			: page.error?.message && !/internal error/i.test(page.error.message)
				? page.error.message
				: labels.errors.unexpected
	);
</script>

<svelte:head><title>{labels.appName}</title></svelte:head>

<main>
	<p class="overline">{page.status}</p>
	<h1>{message}</h1>
	<a class="btn secondary" href="/">{labels.errors.backToday}</a>
</main>

<style>
	main {
		max-width: 420px;
		margin: 0 auto;
		min-height: 100dvh;
		display: grid;
		align-content: center;
		gap: var(--gap);
		padding: var(--gap);
	}
	h1 {
		font-size: 22px;
	}
</style>
