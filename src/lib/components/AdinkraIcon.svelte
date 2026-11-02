<script lang="ts">
	import { adinkraSvg, type AdinkraName } from '$lib/icons';

	let { name, size = 24, label }: { name: AdinkraName; size?: 24 | 32 | 48 | 64; label?: string } =
		$props();
</script>

<!-- Local, trusted SVG files only (no user input). -->
<span
	class="icon s{size}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}>{@html adinkraSvg(name)}</span
>

<style>
	.icon {
		display: inline-flex;
		color: inherit;
	}
	.icon :global(svg) {
		width: 100%;
		height: 100%;
	}
	.s24 { width: 24px; height: 24px; }
	.s32 { width: 32px; height: 32px; }
	.s48 { width: 48px; height: 48px; }
	.s64 { width: 64px; height: 64px; }
</style>
