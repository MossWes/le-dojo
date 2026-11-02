<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import MissionCard from '$lib/components/missions/MissionCard.svelte';
	import MissionForm, { type MissionFormValues } from '$lib/components/missions/MissionForm.svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import { XP_BY_RANK } from '$lib/rules';
	import type { MissionView } from '$lib/server/mission-view';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const m = $derived(data.mission);
	const a = labels.missions.actions;

	let message = $state<string | null>(null);
	let info = $state<string | null>(null);
	let confirming = $state<'reserve' | 'drop' | 'delete' | null>(null);
	let condition = $state('');
	let busy = $state(false);

	const initial = $derived<MissionFormValues>({
		title: m.title,
		rank: m.rank,
		frontId: m.frontId,
		dueDate: m.dueDate,
		plannedDate: m.plannedDate,
		notes: m.notes,
		isTest: m.isTest,
		reviewDate: m.reviewDate
	});

	async function patch(body: Record<string, unknown>, success?: string) {
		busy = true;
		const res = await api('PATCH', `/api/missions/${m.id}`, body);
		busy = false;
		if (!res.ok) {
			message = res.message;
			info = null;
			return false;
		}
		message = null;
		info = success ?? null;
		confirming = null;
		await invalidateAll();
		return true;
	}

	const save = async (values: MissionFormValues) => {
		await patch(values, labels.missions.saved);
	};

	async function remove() {
		busy = true;
		const res = await api('DELETE', `/api/missions/${m.id}`);
		busy = false;
		if (!res.ok) {
			message = res.message;
			return;
		}
		await goto(data.parent ? `/missions/${data.parent.id}` : '/missions', { invalidateAll: true });
	}

	async function toggleSub(s: MissionView) {
		const res = await api('PATCH', `/api/missions/${s.id}`, { status: s.done ? 'todo' : 'done' });
		if (!res.ok) message = res.message;
		await invalidateAll();
	}

	const active = $derived(m.status === 'todo' || m.status === 'doing');
</script>

<svelte:head><title>{m.title} · {labels.appName}</title></svelte:head>

<a class="btn link" href={data.parent ? `/missions/${data.parent.id}` : '/missions'}>← {labels.back}</a>

<header class="head" class:s={m.rank === 'S'}>
	<RankBadge rank={m.rank} />
	<div>
		<h1>{m.title}</h1>
		<p class="meta">{labels.missions.status[m.status]}{#if m.isTest}{' · '}{labels.missions.testBadge}{/if}</p>
		{#if data.parent}<p class="meta"><a href="/missions/{data.parent.id}">{labels.missions.subOf(data.parent.title)}</a></p>{/if}
	</div>
</header>

{#if m.status === 'reserve' && m.startCondition}
	<p class="notice">{labels.missions.reserveCondition(m.startCondition)}</p>
{/if}
{#if message}<p class="notice error" role="alert">{message}</p>{/if}
{#if info}<p class="notice" role="status">{info}</p>{/if}

<div class="actions">
	{#if active}
		<button type="button" class="btn primary" disabled={busy} onclick={() => patch({ status: 'done' }, labels.missions.doneGain(XP_BY_RANK[m.rank]))}>{a.done}</button>
		<button type="button" class="btn secondary" disabled={busy} onclick={() => (confirming = 'reserve')}>{a.reserve}</button>
		<button type="button" class="btn secondary" disabled={busy} onclick={() => (confirming = 'drop')}>{a.drop}</button>
	{:else if m.status === 'done'}
		<button type="button" class="btn secondary" disabled={busy} onclick={() => patch({ status: 'todo' })}>{a.undo}</button>
	{:else}
		<button type="button" class="btn primary" disabled={busy} onclick={() => patch({ status: 'todo' })}>{a.resume}</button>
	{/if}
</div>

{#if confirming === 'reserve'}
	<div class="confirm card">
		<label for="m-condition" class="meta">{labels.missions.fields.startCondition}</label>
		<textarea id="m-condition" rows="2" bind:value={condition}></textarea>
		<div class="row">
			<button type="button" class="btn primary" disabled={busy || !condition.trim()} onclick={() => patch({ status: 'reserve', startCondition: condition })}>{a.reserveConfirm}</button>
			<button type="button" class="btn secondary" onclick={() => (confirming = null)}>{labels.today.cancel}</button>
		</div>
	</div>
{:else if confirming === 'drop'}
	<div class="confirm card">
		<p>{a.dropConfirm}</p>
		<div class="row">
			<button type="button" class="btn primary" disabled={busy} onclick={() => patch({ status: 'dropped' })}>{labels.today.yes}</button>
			<button type="button" class="btn secondary" onclick={() => (confirming = null)}>{labels.today.no}</button>
		</div>
	</div>
{/if}

{#if !m.parentId}
	<section class="section">
		<span class="overline">{labels.missions.subMissions}</span>
		{#if data.subs.length}
			<ul class="list">
				{#each data.subs as s (s.id)}<MissionCard mission={s} ontoggle={toggleSub} />{/each}
			</ul>
		{/if}
		<a class="btn secondary add-sub" href="/missions/nouvelle?parent={m.id}">{labels.missions.addSub}</a>
	</section>
{/if}

<section class="section">
	{#key m.updatedAt}
		<MissionForm {initial} fronts={data.fronts} submitLabel={labels.missions.save} onsubmit={save} />
	{/key}
</section>

<section class="section danger">
	{#if confirming === 'delete'}
		<div class="confirm card">
			<p>{a.deleteConfirm}{#if data.subs.length}{a.deleteSubs(data.subs.length)}{/if}</p>
			<div class="row">
				<button type="button" class="btn primary" disabled={busy} onclick={remove}>{labels.today.yes}</button>
				<button type="button" class="btn secondary" onclick={() => (confirming = null)}>{labels.today.no}</button>
			</div>
		</div>
	{:else}
		<button type="button" class="btn secondary" onclick={() => (confirming = 'delete')}>{a.delete}</button>
	{/if}
</section>

<style>
	.head {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		margin-top: 8px;
		padding-left: 12px;
		border-left: 3px solid var(--line);
	}
	.head.s {
		border-left-color: var(--red);
	}
	.head :global(.rank) {
		margin-top: 4px;
	}
	h1 {
		font-size: 22px;
	}
	.head p {
		margin: 4px 0 0;
	}
	.actions,
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.actions {
		margin-top: var(--gap);
	}
	.confirm {
		margin-top: 12px;
		display: grid;
		gap: 10px;
	}
	.confirm p {
		margin: 0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.add-sub {
		margin-top: 10px;
	}
	.danger {
		padding-top: var(--gap);
		border-top: 1px solid var(--line-soft);
	}
	.notice.error {
		border-left-color: var(--red);
	}
</style>
