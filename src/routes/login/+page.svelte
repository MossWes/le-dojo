<script lang="ts">
	import { goto } from '$app/navigation';
	import AdinkraIcon from '$lib/components/AdinkraIcon.svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let password = $state('');
	let message = $state<string | null>(null);
	let busy = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		const res = await api('POST', '/api/auth/login', { password });
		busy = false;
		if (!res.ok) {
			message = res.message;
			password = '';
			return;
		}
		await goto(data.next, { invalidateAll: true, replaceState: true });
	}
</script>

<svelte:head><title>{labels.login.title} · {labels.appName}</title></svelte:head>

<main>
	<div class="medal"><AdinkraIcon name="fawohodie" size={48} /></div>
	<h1>{labels.appName}</h1>
	<form onsubmit={submit}>
		<label class="visually-hidden" for="password">{labels.login.password}</label>
		<input id="password" type="password" bind:value={password} placeholder={labels.login.password} autocomplete="current-password" required />
		{#if message}<p class="notice" role="alert">{message}</p>{/if}
		<button type="submit" class="btn primary" disabled={busy || !password}>{labels.login.enter}</button>
	</form>
</main>

<style>
	main {
		max-width: 360px;
		margin: 0 auto;
		min-height: 100dvh;
		display: grid;
		align-content: center;
		justify-items: center;
		gap: var(--gap);
		padding: var(--gap);
	}
	.medal {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--medal-ink);
		background: linear-gradient(160deg, var(--medal-1), var(--medal-2) 55%, var(--medal-3));
		box-shadow: 0 0 0 1px var(--line), 0 0 0 6px var(--ink), 0 0 0 7px var(--line-soft);
	}
	h1 {
		font-size: var(--size-title);
		letter-spacing: 0.04em;
	}
	form {
		width: 100%;
		display: grid;
		gap: 12px;
		margin-top: var(--gap);
	}
	input[type='password'] {
		width: 100%;
		min-height: 48px;
		padding: 10px 12px;
		background: var(--ink-sunken);
		color: var(--parch);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		font: inherit;
	}
	input[type='password']:focus {
		outline: 2px solid var(--gold-bright);
		outline-offset: 1px;
	}
</style>
