<script lang="ts">
	import Checkbox from '$lib/components/Checkbox.svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import { RANK_ORDER, XP_BY_RANK } from '$lib/rules';
	import type { TodayData, TodayMission } from '$lib/server/today';

	type Props = {
		missions: TodayData['missions'];
		day: string;
		onChanged: () => Promise<void>;
		notify: (message: string) => void;
	};
	let { missions, day, onChanged, notify }: Props = $props();

	let gained = $state<{ id: number; amount: number } | null>(null);
	let pending = $state<number | null>(null);
	let adding = $state(false);
	let newTitle = $state('');
	let newRank = $state<TodayMission['rank']>('D');

	async function toggle(m: TodayMission) {
		pending = m.id;
		const res = await api('PATCH', `/api/missions/${m.id}`, { status: m.done ? 'todo' : 'done' });
		pending = null;
		if (!res.ok) return notify(res.message);
		if (!m.done) {
			const shown = { id: m.id, amount: XP_BY_RANK[m.rank] };
			gained = shown;
			setTimeout(() => {
				if (gained === shown) gained = null;
			}, 2000);
		}
		await onChanged();
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (!newTitle.trim()) return;
		const res = await api('POST', '/api/missions', { title: newTitle, rank: newRank, plannedDate: day });
		if (!res.ok) return notify(res.message);
		newTitle = '';
		newRank = 'D';
		adding = false;
		await onChanged();
	}
</script>

{#if missions.length === 0}
	<p class="meta">{labels.today.noMission}</p>
{:else}
	<ul class="list">
		{#each missions as m (m.id)}
			<li class:done={m.done}>
				<Checkbox checked={m.done} label={m.title} disabled={pending === m.id} onchange={() => toggle(m)} />
				<RankBadge rank={m.rank} />
				<div class="text">
					<span class="title">{m.title}</span>
					<span class="meta">
						{#if m.front}{m.front}{/if}{#if m.front && m.dueLabel}{' · '}{/if}{#if m.dueLabel}<span class:overdue={m.overdue}>{m.dueLabel}</span>{/if}
					</span>
					{#if m.testReview}<span class="meta question">{labels.today.testQuestion}</span>{/if}
				</div>
				{#if gained?.id === m.id}<span class="gain" aria-live="polite">+{gained.amount}</span>{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if adding}
	<form class="add" onsubmit={add}>
		<label class="visually-hidden" for="new-mission">{labels.today.newMissionPlaceholder}</label>
		<input id="new-mission" type="text" bind:value={newTitle} placeholder={labels.today.newMissionPlaceholder} autocomplete="off" />
		<div class="ranks" role="radiogroup" aria-label="Rang">
			{#each RANK_ORDER as rank (rank)}
				<button type="button" role="radio" aria-checked={newRank === rank} class="btn secondary rank" class:selected={newRank === rank} onclick={() => (newRank = rank)}>{rank}</button>
			{/each}
		</div>
		<div class="row">
			<button type="submit" class="btn primary" disabled={!newTitle.trim()}>{labels.today.add}</button>
			<button type="button" class="btn secondary" onclick={() => (adding = false)}>{labels.today.cancel}</button>
		</div>
	</form>
{:else}
	<button type="button" class="btn secondary add-btn" onclick={() => (adding = true)}>{labels.today.addMission}</button>
{/if}

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0 10px 11px;
		border-bottom: 1px solid var(--line-soft);
	}
	.text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.done .title {
		color: var(--dim);
		text-decoration: line-through;
		text-decoration-color: var(--line);
	}
	.overdue {
		color: var(--red);
	}
	.question {
		color: var(--parch-soft);
		font-style: italic;
	}
	.gain {
		color: var(--gold-bright);
		font-size: var(--size-small);
		font-weight: 600;
	}
	.add-btn {
		margin-top: 12px;
	}
	.add {
		margin-top: 12px;
		display: grid;
		gap: 10px;
	}
	.ranks,
	.row {
		display: flex;
		gap: 8px;
	}
	.rank {
		width: var(--touch);
		padding: 0;
	}
</style>
