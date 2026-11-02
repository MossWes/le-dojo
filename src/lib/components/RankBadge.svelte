<script lang="ts">
	let { rank }: { rank: 'S' | 'A' | 'B' | 'C' | 'D' } = $props();
</script>

<span class="rank r{rank}" aria-label="Rang {rank}">{rank}</span>

<style>
	.rank {
		flex: none;
		width: 24px;
		height: 24px;
		display: inline-grid;
		place-items: center;
		font-weight: 600;
		font-size: var(--size-small);
		line-height: 1;
		border-radius: var(--radius);
		border: 1px solid transparent;
	}
	.rS { background: var(--red); color: var(--parch-bright); }
	.rA { background: var(--gold); color: var(--ink); }
	.rB { border-color: var(--gold); color: var(--gold); }
	.rC { border-color: var(--parch-soft); color: var(--parch-soft); }
	.rD { border-color: var(--dim); color: var(--dim); }
</style>
