<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';

	let { publicKey, devices }: { publicKey: string | null; devices: number } = $props();
	const L = labels.reminders;

	let status = $state<'loading' | 'unsupported' | 'install' | 'off' | 'on' | 'denied'>('loading');
	let message = $state<string | null>(null);
	let busy = $state(false);

	function toKey(base64: string): Uint8Array {
		const pad = '='.repeat((4 - (base64.length % 4)) % 4);
		const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
		return Uint8Array.from(raw, (c) => c.charCodeAt(0));
	}

	onMount(async () => {
		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;
		if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
			status = /iPhone|iPad/.test(navigator.userAgent) && !standalone ? 'install' : 'unsupported';
			return;
		}
		if (Notification.permission === 'denied') return void (status = 'denied');
		const reg = await navigator.serviceWorker.ready;
		status = (await reg.pushManager.getSubscription()) ? 'on' : 'off';
	});

	async function enable() {
		if (!publicKey) return;
		busy = true;
		message = null;
		try {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				status = permission === 'denied' ? 'denied' : 'off';
				return;
			}
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) as BufferSource });
			const res = await api('POST', '/api/push/subscribe', sub.toJSON());
			if (!res.ok) {
				await sub.unsubscribe();
				message = res.message;
				return;
			}
			status = 'on';
		} catch {
			message = L.failed;
		} finally {
			busy = false;
		}
	}

	async function disable() {
		busy = true;
		const reg = await navigator.serviceWorker.ready;
		const sub = await reg.pushManager.getSubscription();
		if (sub) {
			await api('DELETE', '/api/push/subscribe', { endpoint: sub.endpoint });
			await sub.unsubscribe();
		}
		status = 'off';
		busy = false;
	}

	async function test() {
		const res = await api<{ sent: number }>('POST', '/api/push/test');
		message = res.ok ? (res.data.sent ? L.testSent : L.testNone) : res.message;
	}
</script>

<div class="reminders">
	{#if !publicKey}
		<p class="meta">{L.notConfigured}</p>
	{:else if status === 'install'}
		<p class="meta">{L.installFirst}</p>
	{:else if status === 'unsupported'}
		<p class="meta">{L.unsupported}</p>
	{:else if status === 'denied'}
		<p class="meta">{L.denied}</p>
	{:else if status === 'on'}
		<p class="meta">{L.on(devices)}</p>
		<div class="row">
			<button type="button" class="btn secondary" disabled={busy} onclick={test}>{L.test}</button>
			<button type="button" class="btn secondary" disabled={busy} onclick={disable}>{L.disable}</button>
		</div>
	{:else if status === 'off'}
		<button type="button" class="btn secondary" disabled={busy} onclick={enable}>{L.enable}</button>
	{/if}
	<p class="meta">{L.rule}</p>
	{#if message}<p class="notice" role="status">{message}</p>{/if}
</div>

<style>
	.reminders {
		display: grid;
		gap: 10px;
	}
	.reminders p {
		margin: 0;
	}
	.row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
</style>
