<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import MissionCard from '$lib/components/missions/MissionCard.svelte';
	import { api } from '$lib/client/api';
	import { queue } from '$lib/client/queue.svelte';
	import { labels } from '$lib/labels';
	import { RANK_ORDER, XP_BY_RANK } from '$lib/rules';
	import type { MissionView } from '$lib/server/mission-view';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const views = ['todo', 'reserve', 'tests', 'done'] as const;
	let message = $state<string | null>(null);
	let gained = $state<{ id: number; amount: number } | null>(null);

	function href(change: { view?: string; rank?: string | null; front?: number | null }) {
		const view = change.view ?? data.filters.view;
		const rank = change.rank !== undefined ? change.rank : data.filters.rank;
		const front = change.front !== undefined ? change.front : data.filters.frontId;
		const q = new URLSearchParams();
		if (view !== 'todo') q.set('view', view);
		if (rank) q.set('rank', rank);
		if (front) q.set('front', String(front));
		const s = q.toString();
		return s ? `/missions?${s}` : '/missions';
	}

	const groups = $derived(
		RANK_ORDER.map((rank) => ({ rank, items: data.missions.filter((m) => m.rank === rank) })).filter(
			(g) => g.items.length > 0
		)
	);

	async function toggle(m: MissionView) {
		const q = queue.pending(`mission-${m.id}`);
		const done = q ? (q.body as { status: string }).status === 'done' : m.done;
		const res = await api('PATCH', `/api/missions/${m.id}`, { status: done ? 'todo' : 'done' }, { queueKey: `mission-${m.id}` });
		if (!res.ok) {
			message = res.message;
			return;
		}
		if (res.queued) return;
		message = null;
		if (!m.done) {
			const shown = { id: m.id, amount: XP_BY_RANK[m.rank] };
			gained = shown;
			setTimeout(() => {
				if (gained === shown) gained = null;
			}, 2000);
		}
		await invalidateAll();
	}
</script>

<svelte:head><title>{labels.tabs.missions} · {labels.appName}</title></svelte:head>

<header class="top">
	<h1>{labels.missions.title}</h1>
	<a class="btn secondary" href="/missions/nouvelle">{labels.missions.newMission}</a>
</header>

<nav class="views" aria-label="Statut">
	{#each views as view (view)}
		<a class="btn secondary" class:selected={data.filters.view === view} aria-current={data.filters.view === view ? 'true' : undefined} href={href({ view })} data-sveltekit-noscroll data-sveltekit-replacestate>{labels.missions.views[view]}</a>
	{/each}
</nav>

<div class="filters">
	<nav class="ranks" aria-label="Rang">
		<a class="btn secondary chip" class:selected={!data.filters.rank} href={href({ rank: null })} data-sveltekit-noscroll data-sveltekit-replacestate>{labels.missions.allRanks}</a>
		{#each RANK_ORDER as rank (rank)}
			<a class="btn secondary chip" class:selected={data.filters.rank === rank} href={href({ rank })} data-sveltekit-noscroll data-sveltekit-replacestate>{rank}</a>
		{/each}
	</nav>
	<label class="visually-hidden" for="front-filter">{labels.missions.fields.front}</label>
	<select id="front-filter" value={data.filters.frontId ?? ''} onchange={(e) => goto(href({ front: Number(e.currentTarget.value) || null }), { noScroll: true, replaceState: true })}>
		<option value="">{labels.missions.allFronts}</option>
		{#each data.fronts as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
	</select>
</div>

{#if message}<p class="notice" role="alert">{message}</p>{/if}

{#if groups.length === 0}
	<p class="meta empty">{labels.missions.empty}</p>
{:else}
	{#each groups as g (g.rank)}
		<section class="section">
			<span class="overline">{labels.missions.rankGroup(g.rank)} · {g.items.length}</span>
			<ul class="list">
				{#each g.items as m (m.id)}
					{@const q = queue.pending(`mission-${m.id}`)}
					<MissionCard
						mission={q ? { ...m, done: (q.body as { status: string }).status === 'done' } : m}
						waiting={!!q}
						ontoggle={toggle}
						gained={gained?.id === m.id ? gained.amount : null}
					/>
				{/each}
			</ul>
		</section>
	{/each}
{/if}

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--gap);
	}
	h1 {
		font-size: var(--size-title);
	}
	.views {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		margin-top: var(--gap);
	}
	.views .btn {
		padding: 0 4px;
		font-size: 13px;
	}
	.filters {
		display: grid;
		gap: 10px;
		margin-top: 10px;
	}
	.ranks {
		display: grid;
		grid-template-columns: 1.6fr repeat(5, 1fr);
		gap: 6px;
	}
	.chip {
		padding: 0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.empty {
		margin-top: calc(var(--gap) * 2);
		text-align: center;
	}
</style>
