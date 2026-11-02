<script lang="ts">
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { labels } from '$lib/labels';
	import { RANK_ORDER } from '$lib/rules';
	import type { Front } from '$lib/server/services/fronts';

	export type MissionFormValues = {
		title: string;
		rank: 'S' | 'A' | 'B' | 'C' | 'D';
		frontId: number | null;
		dueDate: string | null;
		plannedDate: string | null;
		notes: string;
		isTest: boolean;
		reviewDate: string | null;
	};

	type Props = {
		initial: MissionFormValues;
		fronts: Front[];
		submitLabel: string;
		onsubmit: (values: MissionFormValues) => Promise<void>;
	};
	let { initial, fronts, submitLabel, onsubmit }: Props = $props();

	// The form keeps its own copy; the page passes fresh `initial` values through {#key}.
	// svelte-ignore state_referenced_locally
	let v = $state<MissionFormValues>({ ...initial });
	let busy = $state(false);

	const f = labels.missions.fields;

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		await onsubmit({
			...v,
			dueDate: v.dueDate || null,
			plannedDate: v.plannedDate || null,
			reviewDate: v.isTest ? v.reviewDate || null : null
		});
		busy = false;
	}
</script>

<form class="form" onsubmit={submit}>
	<div class="field">
		<label for="m-title">{f.title}</label>
		<input id="m-title" type="text" bind:value={v.title} required autocomplete="off" />
	</div>

	<div class="field">
		<span class="label" id="m-rank">{f.rank}</span>
		<div class="ranks" role="radiogroup" aria-labelledby="m-rank">
			{#each RANK_ORDER as rank (rank)}
				<button type="button" role="radio" aria-checked={v.rank === rank} class="btn secondary rank" class:selected={v.rank === rank} onclick={() => (v.rank = rank)}>{rank}</button>
			{/each}
		</div>
	</div>

	<div class="field">
		<label for="m-front">{f.front}</label>
		<select id="m-front" bind:value={v.frontId}>
			<option value={null}>{f.noFront}</option>
			{#each fronts as front (front.id)}
				<option value={front.id}>{front.status === 'reserve' ? f.frontReserve(front.name) : front.name}</option>
			{/each}
		</select>
	</div>

	<div class="dates">
		<div class="field">
			<label for="m-due">{f.dueDate}</label>
			<input id="m-due" type="date" bind:value={v.dueDate} />
		</div>
		<div class="field">
			<label for="m-planned">{f.plannedDate}</label>
			<input id="m-planned" type="date" bind:value={v.plannedDate} />
		</div>
	</div>

	<div class="field">
		<label for="m-notes">{f.notes}</label>
		<textarea id="m-notes" rows="4" bind:value={v.notes}></textarea>
	</div>

	<div class="test-row">
		<Checkbox checked={v.isTest} label={f.isTest} onchange={() => (v.isTest = !v.isTest)} />
		<span>{f.isTest}</span>
	</div>
	{#if v.isTest}
		<div class="field">
			<label for="m-review">{f.reviewDate}</label>
			<input id="m-review" type="date" bind:value={v.reviewDate} required />
		</div>
	{/if}

	<button type="submit" class="btn primary" disabled={busy || !v.title.trim()}>{submitLabel}</button>
</form>

<style>
	.form {
		display: grid;
		gap: var(--gap);
	}
	.ranks {
		display: flex;
		gap: 8px;
	}
	.rank {
		width: var(--touch);
		padding: 0;
	}
	.dates {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 12px;
	}
	.dates input {
		width: 100%;
		min-width: 0;
	}
	.test-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-left: 11px;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
</style>
