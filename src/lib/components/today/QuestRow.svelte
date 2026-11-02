<script lang="ts">
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { TodayData } from '$lib/server/today';

	type Props = {
		quest: TodayData['quests'][number];
		day: string;
		onChanged: () => Promise<void>;
		notify: (message: string) => void;
	};
	let { quest, day, onChanged, notify }: Props = $props();

	let writingSlip = $state(false);
	let note = $state('');
	let confirmBackfill = $state(false);
	let busy = $state(false);
	const nf = new Intl.NumberFormat('fr-FR');
	const num = (n: number) => nf.format(n).replace(/\u202f/g, '\u00a0');

	async function setDay(status: 'held' | 'slip') {
		busy = true;
		const res = await api('PUT', `/api/quests/${quest.id}/days/${day}`, { status, note: status === 'slip' ? note : null });
		busy = false;
		if (!res.ok) return notify(res.message);
		writingSlip = false;
		note = '';
		await onChanged();
	}

	async function backfill() {
		busy = true;
		const res = await api('POST', `/api/quests/${quest.id}/backfill`);
		busy = false;
		confirmBackfill = false;
		if (!res.ok) return notify(res.message);
		await onChanged();
	}
</script>

<div class="quest">
	<div class="head">
		<span class="title">{quest.title}</span>
		<span class="day">{labels.today.dayOf(quest.dayNumber, quest.lengthDays)}</span>
	</div>

	{#if quest.kind === 'daily_steps'}
		<p class="meta steps">
			{#if quest.todayValue !== null}
				{labels.today.steps(num(quest.todayValue), num(quest.stepsGoal))} ·
				{quest.todayStatus === 'held' ? labels.today.stepsHeld : labels.today.stepsLogged}
			{:else}
				{labels.today.stepsWaiting(num(quest.stepsGoal))}
			{/if}
		</p>
	{:else}
	<div class="row">
		<button type="button" class="btn secondary" class:selected={quest.todayStatus === 'held'} aria-pressed={quest.todayStatus === 'held'} disabled={busy} onclick={() => setDay('held')}>{labels.today.held}</button>
		<button type="button" class="btn secondary" class:selected={quest.todayStatus === 'slip'} aria-pressed={quest.todayStatus === 'slip'} disabled={busy} onclick={() => (writingSlip = true)}>{labels.today.slip}</button>
	</div>

	{#if writingSlip}
		<div class="slip">
			<label class="visually-hidden" for="slip-{quest.id}">{labels.today.slipNote}</label>
			<textarea id="slip-{quest.id}" rows="2" bind:value={note} placeholder={labels.today.slipNote}></textarea>
			<div class="row">
				<button type="button" class="btn primary" disabled={busy} onclick={() => setDay('slip')}>{labels.today.slipSave}</button>
				<button type="button" class="btn secondary" onclick={() => (writingSlip = false)}>{labels.today.cancel}</button>
			</div>
		</div>
	{:else if quest.todayStatus === 'slip'}
		<p class="meta said">{labels.today.slipDone}{#if quest.todayNote} — « {quest.todayNote} »{/if}</p>
	{/if}
	{/if}

	{#if quest.missingDays > 0 && quest.kind !== 'daily_steps'}
		<div class="missing">
			<p class="meta">{labels.today.missing(quest.missingDays)}</p>
			{#if confirmBackfill}
				<p>{labels.today.backfillConfirm(quest.missingDays)}</p>
				<div class="row">
					<button type="button" class="btn primary" disabled={busy} onclick={backfill}>{labels.today.yes}</button>
					<button type="button" class="btn secondary" onclick={() => (confirmBackfill = false)}>{labels.today.no}</button>
				</div>
			{:else}
				<button type="button" class="btn link" onclick={() => (confirmBackfill = true)}>{labels.today.backfill}</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.quest + :global(.quest) {
		margin-top: var(--gap);
	}
	.head {
		display: flex;
		flex-direction: column;
		margin-bottom: 10px;
	}
	.day {
		color: var(--gold);
		font-size: var(--size-small);
		letter-spacing: 0.04em;
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.row .btn {
		flex: 1;
	}
	.slip {
		margin-top: 10px;
		display: grid;
		gap: 10px;
	}
	.said {
		color: var(--parch-soft);
		margin: 10px 0 0;
	}
	.missing {
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px solid var(--line-soft);
	}
	.missing p {
		margin: 0 0 6px;
	}
</style>
