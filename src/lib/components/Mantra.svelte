<script lang="ts">
	import { labels } from '$lib/labels';
	let { text, large = false }: { text: string; large?: boolean } = $props();
</script>

<figure class="mantra" class:large>
	<figcaption class="overline">{labels.today.mantra}</figcaption>
	<blockquote>{text}</blockquote>
</figure>

<style>
	.mantra {
		margin: 0;
		padding: 14px var(--gap);
		background: var(--red-wash);
		border: 1px solid var(--red-line);
		border-radius: var(--radius);
	}
	.overline {
		color: var(--red);
	}
	blockquote {
		margin: 6px 0 0;
		font-style: italic;
		font-size: var(--size-mantra);
		line-height: 1.4;
		color: var(--parch-bright);
	}
	.large blockquote {
		font-size: var(--size-title);
	}
</style>
