<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import Separator from '$lib/components/Separator.svelte';
	import StepsToken from '$lib/components/me/StepsToken.svelte';
	import { api } from '$lib/client/api';
	import { speech } from '$lib/client/speech.svelte';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const L = labels.me;
	const nf = new Intl.NumberFormat('fr-FR');
	const num = (n: number) => nf.format(n).replace(/ /g, ' ');
	const p = $derived(data.progress);
	const maxDay = $derived(Math.max(10, ...data.history.map((h) => h.xp)));

	// svelte-ignore state_referenced_locally
	let s = $state({ ...data.settings, ritual_morning_until: data.settings.ritual_morning_until ?? '08:00' });
	let voices = $state<{ name: string; lang: string }[]>([]);
	let message = $state<string | null>(null);
	let info = $state<string | null>(null);
	let busy = $state(false);
	let confirmLogout = $state(false);

	onMount(() => {
		if (!speech.supported) return;
		const load = () => (voices = speech.frenchVoices().map((v) => ({ name: v.name, lang: v.lang })));
		load();
		speechSynthesis.addEventListener('voiceschanged', load);
		return () => speechSynthesis.removeEventListener('voiceschanged', load);
	});

	async function save(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		const res = await api('PATCH', '/api/settings', s);
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

	async function logout() {
		await api('POST', '/api/auth/logout');
		// Personal data cached for offline reading is removed from this device.
		if ('caches' in window) for (const key of await caches.keys()) await caches.delete(key);
		await goto('/login', { invalidateAll: true, replaceState: true });
	}
</script>

<svelte:head><title>{L.title} · {labels.appName}</title></svelte:head>

<h1>{L.title}</h1>

<section class="section">
	<span class="overline">{L.progress}</span>
	<div class="card progress">
		<span class="medal"><AdinkraIcon name="fawohodie" size={32} /></span>
		<div>
			<p class="grade">{p.grade.name}</p>
			<p class="xp">{L.xpTotal(num(p.xp))}</p>
			<p class="meta">{p.next ? L.nextGrade(p.next.name, num(p.next.min_xp)) : L.lastGrade}</p>
		</div>
	</div>

	<p class="overline sub">{L.history}</p>
	<div class="chart" role="img" aria-label="{L.history} : {data.history.reduce((a, h) => a + h.xp, 0)} XP">
		{#each data.history as h (h.day)}
			<span class="col" title="{h.day} : {h.xp} XP"><span class="bar" style:height="{(h.xp / maxDay) * 100}%"></span></span>
		{/each}
	</div>

	<p class="overline sub">{L.grades}</p>
	<ol class="grades">
		{#each data.grades as g (g.name)}
			<li class:current={g.name === p.grade.name} class:reached={p.xp >= g.min_xp}>
				<span>{g.name}</span><span class="meta">{num(g.min_xp)}</span>
			</li>
		{/each}
	</ol>
</section>

<section class="section">
	<span class="overline">{L.way}</span>
	<p class="way">«&nbsp;{data.way}&nbsp;»</p>
	<p class="overline sub">{L.redLines}</p>
	<ul class="red-lines">
		{#each data.redLines as line (line)}<li>{line}</li>{/each}
	</ul>
</section>

<section class="section">
	<span class="overline">{L.reviews}</span>
	<a class="btn secondary" href="/moi/bilans">{labels.review.history}</a>
</section>

<section class="section">
	<span class="overline">{L.settings}</span>
	<form class="settings" onsubmit={save}>
		<div class="two">
			<div class="field"><label for="s-mt">{L.morningTime}</label><input id="s-mt" type="time" bind:value={s.ritual_morning_time} required /></div>
			<div class="field"><label for="s-mu">{L.morningUntil}</label><input id="s-mu" type="time" bind:value={s.ritual_morning_until} required /></div>
		</div>
		<div class="field">
			<span class="label" id="s-mode">{L.morningMode}</span>
			<div class="choices" role="radiogroup" aria-labelledby="s-mode">
				{#each ['mantra_only', 'full'] as const as m (m)}
					<button type="button" role="radio" aria-checked={s.ritual_morning_mode === m} class="btn secondary" class:selected={s.ritual_morning_mode === m} onclick={() => (s.ritual_morning_mode = m)}>{L.morningModes[m]}</button>
				{/each}
			</div>
		</div>
		<div class="two">
			<div class="field"><label for="s-es">{L.eveningStart}</label><input id="s-es" type="time" bind:value={s.ritual_evening_start} required /></div>
			<div class="field"><label for="s-ee">{L.eveningEnd}</label><input id="s-ee" type="time" bind:value={s.ritual_evening_end} required /></div>
		</div>
		<div class="field">
			<label for="s-voice">{L.voice}</label>
			{#if voices.length}
				<select id="s-voice" bind:value={s.voice_name}>
					<option value={null}>{L.voiceDefault}</option>
					{#each voices as v (v.name)}<option value={v.name}>{v.name} ({v.lang})</option>{/each}
				</select>
			{:else}
				<p class="meta">{L.voiceNone}</p>
			{/if}
		</div>
		<div class="field">
			<label for="s-rate">{L.rate(s.voice_rate.toLocaleString('fr-FR'))}</label>
			<input id="s-rate" type="range" min="0.5" max="1.5" step="0.05" bind:value={s.voice_rate} />
			<button type="button" class="btn secondary" onclick={() => speech.speak('settings-test', L.voiceSample, { name: s.voice_name, rate: s.voice_rate })}>{L.voiceTest}</button>
		</div>
		<div class="field">
			<label for="s-steps">{L.stepsGoal}</label>
			<input id="s-steps" type="number" inputmode="numeric" min="500" max="100000" step="500" bind:value={s.steps_goal} />
		</div>
		{#if message}<p class="notice" role="alert">{message}</p>{/if}
		{#if info}<p class="notice" role="status">{info}</p>{/if}
		<button type="submit" class="btn primary" disabled={busy}>{L.save}</button>
	</form>
</section>

<section class="section">
	<span class="overline">{L.stepsToken}</span>
	<StepsToken status={data.stepsToken} origin={data.origin} />
</section>

<section class="section">
	<span class="overline">{L.data}</span>
	<div class="stack">
		<a class="btn secondary" href="/api/export" download data-sveltekit-reload>{L.export}</a>
		{#if confirmLogout}
			<div class="card confirm">
				<p>{L.logoutConfirm}</p>
				<div class="choices">
					<button type="button" class="btn primary" onclick={logout}>{labels.today.yes}</button>
					<button type="button" class="btn secondary" onclick={() => (confirmLogout = false)}>{labels.today.no}</button>
				</div>
			</div>
		{:else}
			<button type="button" class="btn secondary" onclick={() => (confirmLogout = true)}>{L.logout}</button>
		{/if}
	</div>
</section>

<Separator />
<p class="meta credit">{labels.adinkraCredit}<br />Polices Lora (SIL OFL) · Icônes Lucide (ISC) · pdf.js (Apache 2.0)</p>

<style>
	h1 {
		font-size: var(--size-title);
		padding-top: var(--gap);
	}
	.progress {
		display: flex;
		gap: var(--gap);
		align-items: center;
	}
	.medal {
		width: 64px;
		height: 64px;
		flex: none;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--medal-ink);
		background: linear-gradient(160deg, var(--medal-1), var(--medal-2) 55%, var(--medal-3));
	}
	.progress p {
		margin: 0;
	}
	.grade {
		font-size: 22px;
		font-weight: 600;
		color: var(--gold-bright);
	}
	.sub {
		margin: var(--gap) 0 8px;
	}
	.chart {
		height: 64px;
		display: grid;
		grid-template-columns: repeat(30, minmax(0, 1fr));
		gap: 2px;
		align-items: end;
		border-bottom: 1px solid var(--line);
	}
	.col {
		height: 100%;
		display: flex;
		align-items: flex-end;
	}
	.bar {
		width: 100%;
		background: var(--gold);
		min-height: 1px;
	}
	.grades {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.grades li {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px;
		color: var(--parch-soft);
		border-left: 2px solid transparent;
	}
	.grades li.reached {
		color: var(--parch);
	}
	.grades li.current {
		border-left-color: var(--gold-bright);
		background: var(--ink-raised);
		color: var(--gold-bright);
		font-weight: 600;
	}
	.way {
		font-style: italic;
		font-size: var(--size-mantra);
		color: var(--parch-bright);
		margin: 0;
	}
	.red-lines {
		margin: 0;
		padding-left: 20px;
	}
	.red-lines li {
		margin: 4px 0;
	}
	.settings {
		display: grid;
		gap: var(--gap);
	}
	.two {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 12px;
	}
	input[type='time'],
	input[type='number'] {
		width: 100%;
		min-width: 0;
		min-height: var(--touch);
		padding: 8px 12px;
		background: var(--ink-sunken);
		color: var(--parch);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		font: inherit;
		color-scheme: dark;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--gold);
	}
	.choices {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 8px;
	}
	.stack {
		display: grid;
		gap: 10px;
	}
	.confirm p {
		margin: 0 0 10px;
	}
	.credit {
		text-align: center;
	}
</style>
