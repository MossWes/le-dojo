<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import Separator from '$lib/components/Separator.svelte';
	import MissionsToday from '$lib/components/today/MissionsToday.svelte';
	import MorningScreen from '$lib/components/today/MorningScreen.svelte';
	import QuestRow from '$lib/components/today/QuestRow.svelte';
	import ReadingCard from '$lib/components/today/ReadingCard.svelte';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = $derived(data.today);
	const p = $derived(t.progress);
	const nf = new Intl.NumberFormat('fr-FR');
	// Regular non-breaking space: the narrow one is nearly invisible in Lora.
	const num = (n: number) => nf.format(n).replace(/\u202f/g, '\u00a0');

	let message = $state<string | null>(null);
	let morningDismissed = $state(false);
	let gradeNotice = $state<string | null>(null);
	let lastGrade: string | null = null;

	$effect(() => {
		const name = p.grade.name;
		if (lastGrade !== null && name !== lastGrade && p.grade.min_xp > 0) {
			gradeNotice = labels.today.newGrade(name);
		}
		lastGrade = name;
	});

	async function refresh() {
		message = null;
		await invalidateAll();
	}

	function notify(text: string) {
		message = text;
	}

	// Coming back to the app (or past midnight): reload today's data.
	onMount(() => {
		const onVisible = () => {
			if (document.visibilityState === 'visible') invalidateAll();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});

	const dayTitle = $derived(t.dayLabel.charAt(0).toUpperCase() + t.dayLabel.slice(1));
	const percent = $derived(Math.round(p.progress * 100));
</script>

<svelte:head><title>{labels.tabs.today} · {labels.appName}</title></svelte:head>

{#if t.showMorning && !morningDismissed && t.reading}
	<MorningScreen mantra={t.reading.reading.mantra} voice={t.voice} onContinue={() => (morningDismissed = true)} />
{/if}

<header class="top">
	<h1>{dayTitle}</h1>
	<div class="grade">
		<span class="grade-name">{p.grade.name}</span>
		<div class="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progression vers le grade suivant">
			<span class="fill" style:width="{percent}%"></span>
		</div>
		<span class="xp">{p.next ? `${num(p.xp)} / ${num(p.next.min_xp)}` : num(p.xp)}</span>
	</div>
</header>

{#if gradeNotice}<p class="notice" role="status">{gradeNotice}</p>{/if}
{#if message}<p class="notice" role="alert">{message}</p>{/if}

{#if t.isEvening}
	<section class="section evening">
		<span class="overline">{labels.today.evening}</span>
		<div class="row">
			<a class="btn primary" href="/serment">{labels.today.myOath}</a>
			<a class="btn secondary" href="/bilan">{labels.today.myReview}</a>
		</div>
		{#if t.isSunday}<a class="btn secondary sunday" href="/moi/revue">{labels.week.title}</a>{/if}
	</section>
{/if}

{#if t.sMission}
	<a class="s-banner" href="/missions/{t.sMission.id}">
		<RankBadge rank="S" />
		<span class="s-text">
			<span class="overline s-label">{labels.today.missionS}</span>
			<span class="s-title">{t.sMission.title}</span>
			{#if t.sMission.dueLabel}<span class="meta">{labels.today.due(t.sMission.dueLabel)}</span>{/if}
		</span>
	</a>
{/if}

{#if t.reading}
	<section class="section">
		<span class="overline">{labels.today.readingTitle}</span>
		{#key t.reading.reading.id}
			<ReadingCard data={t.reading} ritualDone={t.rituals.reading} voice={t.voice} onChanged={refresh} {notify} />
		{/key}
	</section>
{/if}

<section class="section">
	<span class="overline">{labels.today.myMissions}</span>
	<MissionsToday missions={t.missions} day={t.day} onChanged={refresh} {notify} />
</section>

{#if t.quests.length}
	<section class="section">
		<span class="overline">{labels.today.myQuests}</span>
		<div class="card">
			{#each t.quests as quest (quest.id)}
				<QuestRow {quest} day={t.day} onChanged={refresh} {notify} />
			{/each}
		</div>
	</section>
{/if}

<section class="section">
	<span class="overline">{labels.today.myRituals}</span>
	<ul class="rituals">
		{#each ['reading', 'oath', 'evening_review'] as const as r (r)}
			<li class:done={t.rituals[r]}>
				<span class="dot" aria-hidden="true"></span>
				{labels.today.rituals[r]}
				<span class="visually-hidden">{t.rituals[r] ? '(fait)' : '(à faire)'}</span>
			</li>
		{/each}
	</ul>
</section>

<Separator />

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 12px;
		padding-top: var(--gap);
	}
	h1 {
		font-size: var(--size-title);
	}
	.grade {
		display: grid;
		justify-items: end;
		gap: 4px;
		min-width: 110px;
	}
	.grade-name {
		color: var(--gold);
		font-weight: 600;
		font-size: var(--size-small);
	}
	.bar {
		width: 110px;
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
	.xp {
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.row .btn {
		flex: 1;
	}
	.sunday {
		width: 100%;
		margin-top: 10px;
	}
	.s-banner {
		margin-top: var(--gap);
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px var(--gap);
		background: var(--ink-raised);
		border: 1px solid var(--line-soft);
		border-left: 3px solid var(--red);
		border-radius: var(--radius);
		color: var(--parch);
		text-decoration: none;
	}
	.s-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.s-label {
		color: var(--red);
	}
	.s-title {
		font-weight: 600;
	}
	.rituals {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 18px;
		color: var(--parch-soft);
	}
	.rituals li {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid var(--gold);
	}
	.done .dot {
		background: var(--gold);
	}
	.done {
		color: var(--parch);
	}
</style>
