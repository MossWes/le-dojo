<script lang="ts">
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.review;
</script>

<svelte:head><title>{L.history} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/moi">← {labels.back}</a>
<h1>{L.history}</h1>

{#if data.reviews.length === 0}
	<p class="meta">{L.none}</p>
{:else}
	<ul class="list">
		{#each data.reviews as r (r.day)}
			<li>
				<a href="/moi/bilans/{r.day}">
					<span class="date">{r.label}</span>
					<span class="meta excerpt">{r.didWell || r.missedPrinciple || r.fixTomorrow}</span>
					{#if r.keptWord}<span class="meta">{L.q3.replace(/\s?\?$/, '').replace(' ', '')} : {L.keptWord[r.keptWord]}</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		font-size: var(--size-title);
		margin: 8px 0 var(--gap);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li a {
		display: grid;
		gap: 2px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line-soft);
		color: var(--parch);
		text-decoration: none;
	}
	.date {
		font-weight: 600;
	}
	.excerpt {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
