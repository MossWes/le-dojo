<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.review;

	// Fresh copy of the saved review (the form is re-created when the day changes, see {#key}).
	// svelte-ignore state_referenced_locally
	const r = data.review;
	let didWell = $state(r?.didWell ?? '');
	let missedPrinciple = $state(r?.missedPrinciple ?? '');
	let fixTomorrow = $state(r?.fixTomorrow ?? '');
	let keptWord = $state<'oui' | 'en_partie' | 'non' | null>(r?.keptWord ?? null);
	let energy = $state<number | null>(r?.energy ?? null);
	let message = $state<string | null>(null);
	let info = $state<string | null>(null);
	let busy = $state(false);

	async function save(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		const res = await api('PUT', `/api/reviews/${data.day}`, { didWell, missedPrinciple, fixTomorrow, keptWord, energy });
		busy = false;
		if (!res.ok) {
			message = res.message;
			info = null;
			return;
		}
		message = null;
		info = L.saved;
		await invalidateAll();
	}

	const dayTitle = $derived(data.dayLabel.charAt(0).toUpperCase() + data.dayLabel.slice(1));
</script>

<svelte:head><title>{L.title} · {labels.appName}</title></svelte:head>

<main>
	<a class="btn link" href={data.isToday ? '/' : '/moi/bilans'}>← {labels.back}</a>
	<h1>{L.title}</h1>
	<p class="meta">{dayTitle}</p>

	{#if data.question}
		<div class="question">
			<span class="overline">{L.questionOfDay}</span>
			<p>{data.question}</p>
		</div>
	{/if}

	<form onsubmit={save}>
		<div class="field">
			<label for="r-1">{L.q1}</label>
			<textarea id="r-1" rows="3" bind:value={didWell}></textarea>
		</div>
		<div class="field">
			<label for="r-2a">{L.q2a}</label>
			<textarea id="r-2a" rows="2" bind:value={missedPrinciple}></textarea>
		</div>
		<div class="field">
			<label for="r-2b">{L.q2b}</label>
			<textarea id="r-2b" rows="2" bind:value={fixTomorrow}></textarea>
		</div>
		<div class="field">
			<span class="label" id="r-3">{L.q3}</span>
			<div class="choices" role="radiogroup" aria-labelledby="r-3">
				{#each ['oui', 'en_partie', 'non'] as const as k (k)}
					<button type="button" role="radio" aria-checked={keptWord === k} class="btn secondary" class:selected={keptWord === k} onclick={() => (keptWord = keptWord === k ? null : k)}>{L.keptWord[k]}</button>
				{/each}
			</div>
		</div>
		<div class="field">
			<span class="label" id="r-4">{L.energy}</span>
			<div class="choices energy" role="radiogroup" aria-labelledby="r-4">
				{#each [1, 2, 3, 4, 5] as n (n)}
					<button type="button" role="radio" aria-checked={energy === n} class="btn secondary" class:selected={energy === n} onclick={() => (energy = energy === n ? null : n)}>{n}</button>
				{/each}
			</div>
		</div>

		{#if message}<p class="notice" role="alert">{message}</p>{/if}
		{#if info}<p class="notice" role="status">{info}</p>{/if}

		<button type="submit" class="btn primary" disabled={busy}>{L.save}</button>
		<p class="footer">{L.footer}</p>
	</form>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--gap) var(--gap) calc(var(--gap) * 3);
	}
	h1 {
		font-size: var(--size-title);
		margin-top: 8px;
	}
	.question {
		margin-top: var(--gap);
		padding: 12px var(--gap);
		border-left: 1px solid var(--line);
	}
	.question p {
		margin: 4px 0 0;
		font-style: italic;
		color: var(--parch-soft);
	}
	form {
		display: grid;
		gap: var(--gap);
		margin-top: var(--gap);
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.choices.energy {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}
	.footer {
		margin: 0;
		text-align: center;
		font-style: italic;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
</style>
