<script lang="ts">
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import { labels } from '$lib/labels';
	import type { MissionView } from '$lib/server/mission-view';

	type Props = { mission: MissionView; ontoggle?: (m: MissionView) => void; gained?: number | null; waiting?: boolean };
	let { mission: m, ontoggle, gained = null, waiting = false }: Props = $props();
</script>

<li class="mission" class:done={m.done} class:dropped={m.status === 'dropped'}>
	{#if ontoggle && (m.active || m.done)}
		<Checkbox checked={m.done} label={m.title} onchange={() => ontoggle(m)} />
	{/if}
	<RankBadge rank={m.rank} />
	<a class="body" href="/missions/{m.id}">
		<span class="title">{m.title}</span>
		<span class="meta">
			{#if m.front}{m.front}{/if}{#if m.front && m.dueLabel}{' · '}{/if}{#if m.dueLabel}<span class:overdue={m.overdue}>{m.dueLabel}</span>{/if}
			{#if m.status === 'dropped'}<span>{' · '}{labels.missions.dropped}</span>{/if}
		</span>
		{#if m.parentTitle}<span class="meta">↳ {m.parentTitle}</span>{/if}
		{#if m.status === 'reserve' && m.startCondition}
			<span class="meta condition">{labels.missions.reserveCondition(m.startCondition)}</span>
		{/if}
		{#if m.isTest && m.reviewLabel}
			<span class="meta test"><FlaskConical size={14} /> {labels.missions.review(m.reviewLabel)}</span>
		{/if}
		{#if m.testReview}<span class="meta question">{labels.today.testQuestion}</span>{/if}
		{#if waiting}<span class="meta waiting">{labels.queue.waiting}</span>{/if}
	</a>
	{#if gained}<span class="gain" aria-live="polite">+{gained}</span>{/if}
</li>

<style>
	.mission {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 0 12px 11px;
		border-bottom: 1px solid var(--line-soft);
	}
	.mission :global(.rank) {
		margin-top: 2px;
	}
	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		color: var(--parch);
		text-decoration: none;
	}
	.done .title,
	.dropped .title {
		color: var(--dim);
	}
	.done .title {
		text-decoration: line-through;
		text-decoration-color: var(--line);
	}
	.overdue {
		color: var(--red);
	}
	.condition,
	.question {
		font-style: italic;
		color: var(--parch-soft);
	}
	.test {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--parch-soft);
	}
	.waiting {
		color: var(--gold);
		font-style: italic;
	}
	.gain {
		color: var(--gold-bright);
		font-size: var(--size-small);
		font-weight: 600;
		align-self: center;
	}
</style>
