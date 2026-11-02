<script lang="ts">
	import { goto } from '$app/navigation';
	import MissionForm, { type MissionFormValues } from '$lib/components/missions/MissionForm.svelte';
	import { api } from '$lib/client/api';
	import { labels } from '$lib/labels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let message = $state<string | null>(null);

	const initial = $derived<MissionFormValues>({
		title: '',
		rank: 'D',
		frontId: data.parent?.frontId ?? null,
		dueDate: null,
		plannedDate: null,
		notes: '',
		isTest: false,
		reviewDate: null
	});

	async function create(values: MissionFormValues) {
		const res = await api<{ id: number }>('POST', '/api/missions', { ...values, parentId: data.parent?.id ?? null });
		if (!res.ok) {
			message = res.message;
			return;
		}
		await goto(data.parent ? `/missions/${data.parent.id}` : `/missions/${res.data.id}`, { invalidateAll: true });
	}
</script>

<svelte:head><title>{labels.missions.newTitle} · {labels.appName}</title></svelte:head>

<a class="btn link" href={data.parent ? `/missions/${data.parent.id}` : '/missions'}>← {labels.back}</a>
<h1>{data.parent ? labels.missions.newSub : labels.missions.newTitle}</h1>
{#if data.parent}<p class="meta">{labels.missions.subOf(data.parent.title)}</p>{/if}
{#if message}<p class="notice" role="alert">{message}</p>{/if}

<div class="section">
	<MissionForm {initial} fronts={data.fronts} submitLabel={labels.missions.create} onsubmit={create} />
</div>

<style>
	h1 {
		font-size: var(--size-title);
		margin-top: 8px;
	}
</style>
