<script lang="ts">
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import Separator from '$lib/components/Separator.svelte';
	import { labels } from '$lib/labels';
</script>

<svelte:head>
	<title>{labels.appName}</title>
</svelte:head>

<main>
	<div class="medal">
		<AdinkraIcon name="fawohodie" size={48} />
	</div>
	<h1>{labels.appName}</h1>

	<Separator />

	<p class="overline">{labels.myWay}</p>
	<p class="way">«&nbsp;{labels.way}&nbsp;»</p>

	<Separator />

	<p class="status">{labels.foundationsReady}</p>
</main>

<style>
	main {
		max-width: 390px;
		margin: 0 auto;
		padding: calc(var(--gap) * 4) var(--gap) var(--gap);
		text-align: center;
	}
	.medal {
		width: 96px;
		height: 96px;
		margin: 0 auto var(--gap);
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--medal-ink);
		background: linear-gradient(160deg, var(--medal-1), var(--medal-2) 55%, var(--medal-3));
		box-shadow: 0 0 0 1px var(--line), 0 0 0 6px var(--ink), 0 0 0 7px var(--line-soft);
	}
	h1 {
		font-size: var(--size-title);
		letter-spacing: 0.04em;
	}
	.way {
		font-style: italic;
		font-size: var(--size-mantra);
		color: var(--parch-bright);
		margin: 8px 0 0;
	}
	.status {
		font-size: var(--size-small);
		color: var(--dim);
		margin: 0;
	}
</style>
