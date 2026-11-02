<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import MissionCard from '$lib/components/missions/MissionCard.svelte';
	import { api } from '$lib/client/api';
	import { addDays } from '$lib/dates';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.week;
	const w = $derived(data.week);

	let chosen = $state<number[]>([]);
	let dayIndex = $state(0);
	let message = $state<string | null>(null);
	let info = $state<string | null>(null);
	let busy = $state(false);

	const days = $derived(
		L.days.map((name, i) => ({ name, day: addDays(w.nextMonday, i) })).filter((d) => d.day >= data.today)
	);

	function toggle(id: number) {
		chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
	}

	async function plan() {
		busy = true;
		const res = await api<{ planned: number }>('POST', '/api/week', { missionIds: chosen, day: days[dayIndex]?.day });
		busy = false;
		if (!res.ok) {
			message = res.message;
			return;
		}
		info = L.planned(res.data.planned);
		chosen = [];
		message = null;
		await invalidateAll();
	}
</script>

<svelte:head><title>{L.title} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/moi">← {labels.back}</a>
<h1>{L.title}</h1>
<p class="meta">{L.range(w.startLabel, w.endLabel)}</p>

<section class="section">
	<span class="overline">{L.xp}</span>
	<p class="xp">+{w.xp} XP</p>
	<ul class="kinds">
		{#each Object.entries(w.xpByKind) as [kind, n] (kind)}<li>{L.xpKinds[kind] ?? kind} : {n}</li>{/each}
	</ul>
</section>

<section class="section">
	<span class="overline">{L.done} · {w.done.length}</span>
	{#if w.done.length}
		<ul class="list">{#each w.done as m (m.id)}<MissionCard mission={m} />{/each}</ul>
	{:else}<p class="meta">{L.noneDone}</p>{/if}
</section>

<section class="section">
	<span class="overline">{L.slipped} · {w.slipped.length}</span>
	{#if w.slipped.length}
		<p class="meta">{L.slippedHint}</p>
		<ul class="list">{#each w.slipped as m (m.id)}<MissionCard mission={m} />{/each}</ul>
	{:else}<p class="meta">{L.noneSlipped}</p>{/if}
</section>

<section class="section">
	<span class="overline">{L.plan}</span>
	<ul class="list plan">
		{#each w.candidates as m (m.id)}
			<li>
				<Checkbox checked={chosen.includes(m.id)} label={m.title} onchange={() => toggle(m.id)} />
				<RankBadge rank={m.rank} />
				<span class="title">{m.title}{#if m.plannedNextWeek}<span class="meta">{' · '}{L.already}</span>{/if}</span>
			</li>
		{/each}
	</ul>
	<div class="field day">
		<label for="w-day">{L.planDay}</label>
		<select id="w-day" bind:value={dayIndex}>
			{#each days as d, i (d.day)}<option value={i}>{d.name}</option>{/each}
		</select>
	</div>
	{#if message}<p class="notice" role="alert">{message}</p>{/if}
	{#if info}<p class="notice" role="status">{info}</p>{/if}
	<button type="button" class="btn primary" disabled={busy || chosen.length === 0} onclick={plan}>{L.planButton(chosen.length)}</button>
</section>

<style>
	h1 {
		font-size: var(--size-title);
		margin-top: 8px;
	}
	.xp {
		font-size: 28px;
		font-weight: 600;
		color: var(--gold-bright);
		margin: 0;
	}
	.kinds {
		list-style: none;
		padding: 0;
		margin: 4px 0 0;
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.plan li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0 10px 11px;
		border-bottom: 1px solid var(--line-soft);
	}
	.day {
		margin: var(--gap) 0;
	}
</style>
