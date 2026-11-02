<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.quests;
	const q = $derived(data.quest);
	const shownDay = $derived(Math.min(q.state.dayNumber, q.lengthDays ?? Infinity));

	let selected = $state<string | null>(null);
	let note = $state('');
	let message = $state<string | null>(null);
	let info = $state<string | null>(null);
	let confirmBackfill = $state(false);
	let busy = $state(false);

	const sel = $derived(q.calendar.find((c) => c.day === selected) ?? null);

	function select(day: string) {
		const c = q.calendar.find((x) => x.day === day);
		if (!c || c.isFuture) return;
		selected = day;
		note = c.note ?? '';
		info = null;
	}

	async function setDay(status: 'held' | 'slip') {
		if (!sel) return;
		busy = true;
		const res = await api('PUT', `/api/quests/${q.id}/days/${sel.day}`, { status, note: status === 'slip' ? note : null });
		busy = false;
		if (!res.ok) {
			message = res.message;
			return;
		}
		message = null;
		info = status === 'slip' ? labels.today.slipDone : labels.today.heldDone;
		await invalidateAll();
	}

	async function backfill() {
		busy = true;
		const res = await api('POST', `/api/quests/${q.id}/backfill`);
		busy = false;
		confirmBackfill = false;
		if (!res.ok) message = res.message;
		await invalidateAll();
	}
</script>

<svelte:head><title>{q.title} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/quetes">← {labels.back}</a>
<h1>{q.title}</h1>

<div class="big">
	<span class="overline">{L.day}</span>
	<span class="number">{shownDay}</span>
	{#if q.lengthDays}<span class="total">/ {q.lengthDays}</span>{/if}
</div>
{#if q.finished}<p class="meta">{L.over}</p>{:else if q.endLabel}<p class="meta">{L.ends(q.endLabel)}</p>{/if}

{#if q.lengthDays}
	<div class="progress" aria-hidden="true">
		<span class="fill" style:width="{Math.min(100, (shownDay / q.lengthDays) * 100)}%"></span>
		{#each q.milestones as m (m.day)}
			<span class="mark" class:reached={q.state.milestones.find((x) => x.day === m.day)?.reached} style:left="{(m.day / q.lengthDays) * 100}%"></span>
		{/each}
	</div>
{/if}
<ul class="milestones">
	{#each q.state.milestones as m (m.day)}
		<li class:reached={m.reached}>{L.milestone(m.day, m.xp)}</li>
	{/each}
</ul>
<p class="meta">{labels.quests.held(q.state.held)} · {labels.quests.slips(q.state.slips)}</p>

{#if message}<p class="notice" role="alert">{message}</p>{/if}

{#if q.state.missingDays.length > 0 && !q.finished}
	<div class="card backfill">
		<p class="meta">{labels.today.missing(q.state.missingDays.length)}</p>
		{#if confirmBackfill}
			<p>{labels.today.backfillConfirm(q.state.missingDays.length)}</p>
			<div class="row">
				<button type="button" class="btn primary" disabled={busy} onclick={backfill}>{labels.today.yes}</button>
				<button type="button" class="btn secondary" onclick={() => (confirmBackfill = false)}>{labels.today.no}</button>
			</div>
		{:else}
			<button type="button" class="btn secondary" onclick={() => (confirmBackfill = true)}>{labels.today.backfill}</button>
		{/if}
	</div>
{/if}

<section class="section">
	<span class="overline">{L.calendar}</span>
	<div class="grid" role="grid" aria-label={L.calendar}>
		{#each q.calendar as c (c.day)}
			<button
				type="button"
				class="cell {c.status ?? (c.isFuture ? 'future' : 'empty')}"
				class:today={c.isToday}
				class:selected={c.day === selected}
				disabled={c.isFuture}
				aria-label="{L.editDay(c.number, c.label)} : {c.status === 'held' ? L.legend.held : c.status === 'slip' ? L.legend.slip : c.isFuture ? L.legend.future : L.legend.empty}"
				onclick={() => select(c.day)}>{c.number}</button
			>
		{/each}
	</div>
	<ul class="legend">
		<li><span class="cell held"></span>{L.legend.held}</li>
		<li><span class="cell slip"></span>{L.legend.slip}</li>
		<li><span class="cell empty"></span>{L.legend.empty}</li>
		<li><span class="cell future"></span>{L.legend.future}</li>
	</ul>
</section>

{#if sel}
	<div class="card editor">
		<p class="overline">{L.editDay(sel.number, sel.label)}</p>
		<div class="row">
			<button type="button" class="btn secondary" class:selected={sel.status === 'held'} disabled={busy} onclick={() => setDay('held')}>{labels.today.held}</button>
			<button type="button" class="btn secondary" class:selected={sel.status === 'slip'} disabled={busy} onclick={() => setDay('slip')}>{labels.today.slip}</button>
		</div>
		<label class="visually-hidden" for="day-note">{labels.today.slipNote}</label>
		<textarea id="day-note" rows="2" bind:value={note} placeholder={labels.today.slipNote}></textarea>
		{#if info}<p class="meta" role="status">{info}</p>{/if}
		<button type="button" class="btn link" onclick={() => (selected = null)}>{L.close}</button>
	</div>
{/if}

<style>
	h1 {
		font-size: 22px;
		margin-top: 8px;
	}
	.big {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-top: var(--gap);
	}
	.number {
		font-size: 64px;
		font-weight: 600;
		line-height: 1;
		color: var(--gold-bright);
	}
	.total {
		font-size: var(--size-title);
		color: var(--parch-soft);
	}
	.progress {
		position: relative;
		height: 6px;
		margin: var(--gap) 0 8px;
		background: var(--line-soft);
		border-radius: 3px;
	}
	.progress .fill {
		display: block;
		height: 100%;
		background: var(--gold);
		border-radius: 3px;
	}
	.mark {
		position: absolute;
		top: -4px;
		width: 2px;
		height: 14px;
		margin-left: -1px;
		background: var(--parch-soft);
	}
	.mark.reached {
		background: var(--gold-bright);
	}
	.milestones {
		list-style: none;
		padding: 0;
		margin: 8px 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
	.milestones .reached {
		color: var(--gold-bright);
	}
	.backfill {
		margin-top: var(--gap);
		display: grid;
		gap: 8px;
	}
	.backfill p {
		margin: 0;
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.row .btn {
		flex: 1;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: 4px;
	}
	.cell {
		aspect-ratio: 1;
		min-width: 0;
		display: grid;
		place-items: center;
		padding: 0;
		border-radius: 2px;
		border: 1px solid var(--line-soft);
		background: transparent;
		color: var(--parch-soft);
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	.cell.held {
		background: var(--gold);
		border-color: var(--gold);
		color: var(--ink);
	}
	.cell.slip {
		border-color: var(--red);
		color: var(--parch);
	}
	.cell.logged {
		border-color: var(--parch-soft);
		color: var(--parch);
	}
	.cell.empty {
		border-style: dashed;
		border-color: var(--line);
		color: var(--parch-soft);
	}
	.cell.future {
		opacity: 0.45;
		cursor: default;
	}
	.cell.today {
		outline: 2px solid var(--gold-bright);
		outline-offset: 1px;
	}
	.cell.selected {
		outline: 2px solid var(--parch);
		outline-offset: 1px;
	}
	.legend {
		list-style: none;
		padding: 0;
		margin: 12px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px 16px;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.legend .cell {
		width: 14px;
		height: 14px;
		display: inline-block;
	}
	.editor {
		margin-top: var(--gap);
		display: grid;
		gap: 10px;
	}
	.editor p {
		margin: 0;
	}
</style>
