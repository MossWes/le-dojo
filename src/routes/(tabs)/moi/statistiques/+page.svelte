<script lang="ts">
	import { formatDayShort } from '$lib/dates';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.stats;
	const s = $derived(data.stats);
	const nf = new Intl.NumberFormat('fr-FR');
	const num = (n: number) => nf.format(n).replace(/ /g, ' ');

	// Missions by front: bars relative to the busiest front.
	const maxFront = $derived(Math.max(1, ...s.byFront.map((f) => f.done + f.open)));

	// XP curve (SVG 320 × 150, padded).
	const W = 320;
	const H = 150;
	const PAD = { l: 8, r: 8, t: 10, b: 22 };
	const last = $derived(s.curve.at(-1)?.total ?? 0);
	const nextGrade = $derived(data.grades.find((g) => g.min_xp > last) ?? null);
	const yMax = $derived(Math.max(10, nextGrade ? nextGrade.min_xp : last));
	const x = (i: number) => PAD.l + (s.curve.length > 1 ? (i / (s.curve.length - 1)) * (W - PAD.l - PAD.r) : 0);
	const y = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);
	const points = $derived(s.curve.map((c, i) => `${x(i).toFixed(1)},${y(c.total).toFixed(1)}`).join(' '));
	const area = $derived(
		s.curve.length ? `${PAD.l},${H - PAD.b} ${points} ${x(s.curve.length - 1).toFixed(1)},${H - PAD.b}` : ''
	);
	const lines = $derived(data.grades.filter((g) => g.min_xp > 0 && g.min_xp <= yMax));
</script>

<svelte:head><title>{L.title} · {labels.appName}</title></svelte:head>

<a class="btn link" href="/moi">← {labels.back}</a>
<h1>{L.title}</h1>

<section class="section">
	<span class="overline">{L.regularity}</span>
	<div class="strip" role="img" aria-label={L.regularitySummary(s.daysWithRitual, s.days, s.ritualRate)}>
		{#each s.regularity as d (d.day)}
			<span class="cell l{Math.min(3, d.rituals)}" title="{formatDayShort(d.day)} · {L.levels[Math.min(3, d.rituals)]}">
				{#if d.held}<span class="dot"></span>{/if}
			</span>
		{/each}
	</div>
	<p class="meta">{L.regularitySummary(s.daysWithRitual, s.days, s.ritualRate)}</p>
	<ul class="legend">
		{#each L.levels as level, i (level)}<li><span class="cell l{i}"></span>{level}</li>{/each}
		<li><span class="cell l0"><span class="dot"></span></span>{L.heldLegend}</li>
	</ul>
</section>

<section class="section">
	<span class="overline">{L.byFront}</span>
	<p class="meta">{L.doneRecent(s.doneThisPeriod)}</p>
	{#if s.byFront.length === 0}
		<p class="meta">{L.empty}</p>
	{:else}
		<ul class="fronts">
			{#each s.byFront as f (f.name)}
				<li>
					<span class="name">{f.name}</span>
					<span class="bars" aria-hidden="true">
						<span class="done" style:width="{(f.done / maxFront) * 100}%"></span>
						<span class="open" style:width="{(f.open / maxFront) * 100}%"></span>
					</span>
					<span class="meta counts">{L.counts(f.done, f.open)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="section">
	<span class="overline">{L.curve}</span>
	{#if s.curve.length < 2}
		<p class="meta">{L.empty}</p>
	{:else}
		<svg class="curve" viewBox="0 0 {W} {H}" role="img" aria-label="{L.curve} : {num(last)} XP">
			{#each lines as g (g.name)}
				<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(g.min_xp)} y2={y(g.min_xp)} />
				<text class="grade" x={W - PAD.r} y={y(g.min_xp) - 4} text-anchor="end">{g.name} · {num(g.min_xp)}</text>
			{/each}
			<line class="axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
			<polygon class="area" points={area} />
			<polyline class="line" points={points} />
			<text class="date" x={PAD.l} y={H - 6}>{formatDayShort(s.curve[0]!.day)}</text>
			<text class="date" x={W - PAD.r} y={H - 6} text-anchor="end">{formatDayShort(s.curve.at(-1)!.day)}</text>
		</svg>
		<p class="meta">{num(last)} XP</p>
	{/if}
</section>

<style>
	h1 {
		font-size: var(--size-title);
		margin-top: 8px;
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(30, minmax(0, 1fr));
		gap: 2px;
	}
	.cell {
		position: relative;
		aspect-ratio: 1 / 2;
		border-radius: 1px;
		background: var(--gold);
		display: inline-block;
	}
	.l0 {
		background: var(--line-soft);
	}
	.l1 {
		opacity: 0.4;
	}
	.l2 {
		opacity: 0.7;
	}
	.dot {
		position: absolute;
		left: 50%;
		bottom: -6px;
		width: 4px;
		height: 4px;
		margin-left: -2px;
		border-radius: 50%;
		background: var(--parch);
	}
	.legend {
		list-style: none;
		padding: 0;
		margin: 10px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		font-size: var(--size-small);
		color: var(--parch-soft);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.legend .cell {
		width: 8px;
		aspect-ratio: auto;
		height: 14px;
	}
	.fronts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 12px;
	}
	.fronts li {
		display: grid;
		gap: 4px;
	}
	.bars {
		display: flex;
		height: 8px;
		background: var(--ink-sunken);
		border-radius: 2px;
		overflow: hidden;
	}
	.bars .done {
		background: var(--gold);
	}
	.bars .open {
		border: 1px solid var(--line);
		box-sizing: border-box;
	}
	.curve {
		width: 100%;
		height: auto;
		display: block;
	}
	.curve .grid {
		stroke: var(--line-soft);
		stroke-dasharray: 3 3;
	}
	.curve .axis {
		stroke: var(--line);
	}
	.curve .area {
		fill: var(--gold);
		opacity: 0.12;
	}
	.curve .line {
		fill: none;
		stroke: var(--gold-bright);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.curve text {
		font-size: 9px;
		fill: var(--parch-soft);
	}
</style>
