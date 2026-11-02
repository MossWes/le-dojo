<script lang="ts">
	import { page } from '$app/state';
	import AdinkraIcon from './AdinkraIcon.svelte';
	import { labels } from '$lib/labels';
	import type { AdinkraName } from '$lib/icons';

	const tabs: { href: string; label: string; icon: AdinkraName }[] = [
		{ href: '/', label: labels.tabs.today, icon: 'asase-ye-duru' },
		{ href: '/missions', label: labels.tabs.missions, icon: 'hye-won-hye' },
		{ href: '/quetes', label: labels.tabs.quests, icon: 'nkyinkyim' },
		{ href: '/bibliotheque', label: labels.tabs.library, icon: 'sankofa-two' },
		{ href: '/moi', label: labels.tabs.me, icon: 'fawohodie' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<nav class="tabbar" aria-label="Navigation principale">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class:active={isActive(tab.href)} aria-current={isActive(tab.href) ? 'page' : undefined}>
			<AdinkraIcon name={tab.icon} size={24} />
			<span>{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.tabbar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		background: var(--ink-sunken);
		border-top: 1px solid var(--line-soft);
		padding-bottom: env(safe-area-inset-bottom);
		z-index: 10;
	}
	a {
		position: relative;
		min-height: 56px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		color: var(--parch-soft);
		text-decoration: none;
		font-size: 11px;
		letter-spacing: 0.02em;
	}
	a.active {
		color: var(--gold-bright);
	}
	a.active::before {
		content: '';
		position: absolute;
		top: -1px;
		left: 30%;
		right: 30%;
		height: 2px;
		background: var(--gold-bright);
	}
</style>
