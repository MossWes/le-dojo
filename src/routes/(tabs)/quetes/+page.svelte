<script lang="ts">
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.quests;
</script>

<svelte:head><title>{labels.tabs.quests} · {labels.appName}</title></svelte:head>

<h1>{L.title}</h1>

{#each [{ title: L.active, items: data.active }, { title: L.finished, items: data.finished }] as group (group.title)}
	{#if group.items.length}
		<section class="section">
			<span class="overline">{group.title}</span>
			{#each group.items as q (q.id)}
				<a class="card quest" href="/quetes/{q.id}">
					<span class="title">{q.title}</span>
					<span class="day">{L.day} {q.dayNumber} {L.of(q.lengthDays)}</span>
					{#if q.lengthDays}
						<span class="bar"><span class="fill" style:width="{Math.min(100, (q.dayNumber / q.lengthDays) * 100)}%"></span></span>
					{/if}
					<span class="meta">{L.held(q.held)} · {L.slips(q.slips)}{#if q.endLabel}{' · '}{L.ends(q.endLabel)}{/if}</span>
				</a>
			{/each}
		</section>
	{/if}
{/each}

{#if !data.active.length && !data.finished.length}<p class="meta">{L.none}</p>{/if}

<style>
	h1 {
		font-size: var(--size-title);
		padding-top: var(--gap);
	}
	.quest {
		display: grid;
		gap: 6px;
		color: var(--parch);
		text-decoration: none;
	}
	.quest + .quest {
		margin-top: 12px;
	}
	.title {
		font-weight: 600;
	}
	.day {
		color: var(--gold);
	}
	.bar {
		height: 3px;
		background: var(--line-soft);
		border-radius: 2px;
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		background: var(--gold);
	}
</style>
