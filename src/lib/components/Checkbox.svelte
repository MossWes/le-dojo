<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	let {
		checked,
		label,
		disabled = false,
		onchange
	}: { checked: boolean; label: string; disabled?: boolean; onchange: () => void } = $props();
</script>

<button
	type="button"
	role="checkbox"
	aria-checked={checked}
	aria-label={label}
	class="box"
	class:checked
	{disabled}
	onclick={onchange}
>
	<span class="square">{#if checked}<Check size={16} strokeWidth={3} />{/if}</span>
</button>

<style>
	.box {
		flex: none;
		width: var(--touch);
		height: var(--touch);
		display: grid;
		place-items: center;
		background: none;
		border: 0;
		padding: 0;
		margin: -11px;
		cursor: pointer;
	}
	.square {
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
		border: 1px solid var(--gold);
		border-radius: 2px;
		color: var(--ink);
		transition: background var(--duration);
	}
	.checked .square {
		background: var(--gold);
	}
</style>
