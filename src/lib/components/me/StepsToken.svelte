<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';

	type Status = { active: boolean; createdAt: string | null; lastUsedAt: string | null };
	let { status, origin }: { status: Status; origin: string } = $props();
	const L = labels.me;

	let token = $state<string | null>(null);
	let copied = $state(false);
	let confirmRevoke = $state(false);
	let message = $state<string | null>(null);

	const fmt = (iso: string | null) =>
		iso ? new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }) : null;

	async function create() {
		const res = await api<{ token: string }>('POST', '/api/settings/steps-token');
		if (!res.ok) return void (message = res.message);
		token = res.data.token;
		copied = false;
		await invalidateAll();
	}

	async function revoke() {
		const res = await api('DELETE', '/api/settings/steps-token');
		if (!res.ok) return void (message = res.message);
		token = null;
		confirmRevoke = false;
		await invalidateAll();
	}

	async function copy() {
		if (!token) return;
		await navigator.clipboard.writeText(token).catch(() => {});
		copied = true;
	}
</script>

<div class="steps">
	<p class="meta">{L.stepsUrl(origin)}</p>
	{#if status.active}
		<p class="meta">{L.stepsTokenActive(fmt(status.createdAt) ?? '', fmt(status.lastUsedAt))}</p>
	{:else}
		<p class="meta">{L.stepsTokenNone}</p>
	{/if}

	{#if token}
		<div class="card token">
			<code>{token}</code>
			<p class="meta">{L.stepsTokenShown}</p>
			<button type="button" class="btn secondary" onclick={copy}>{copied ? L.stepsTokenCopied : L.stepsTokenCopy}</button>
		</div>
	{/if}

	{#if message}<p class="notice" role="alert">{message}</p>{/if}

	{#if confirmRevoke}
		<div class="card">
			<p>{L.stepsTokenRevokeConfirm}</p>
			<div class="row">
				<button type="button" class="btn primary" onclick={revoke}>{labels.today.yes}</button>
				<button type="button" class="btn secondary" onclick={() => (confirmRevoke = false)}>{labels.today.no}</button>
			</div>
		</div>
	{:else}
		<div class="row">
			<button type="button" class="btn secondary" onclick={create}>{status.active ? L.stepsTokenRenew : L.stepsTokenCreate}</button>
			{#if status.active}<button type="button" class="btn secondary" onclick={() => (confirmRevoke = true)}>{L.stepsTokenRevoke}</button>{/if}
		</div>
	{/if}
</div>

<style>
	.steps {
		display: grid;
		gap: 10px;
	}
	.steps p {
		margin: 0;
	}
	.token {
		display: grid;
		gap: 8px;
	}
	code {
		font-family: ui-monospace, Menlo, monospace;
		font-size: var(--size-small);
		color: var(--gold-bright);
		word-break: break-all;
		user-select: all;
	}
	.row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.card p {
		margin: 0 0 10px;
	}
</style>
