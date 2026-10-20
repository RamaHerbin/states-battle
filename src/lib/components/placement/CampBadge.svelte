<script lang="ts">
	import type { Camp } from '$lib/game/types';

	let { camp, size = 40 }: { camp: Camp; size?: number } = $props();
</script>

<svg
	class="sb-badge sb-badge--{camp}"
	width={size}
	height={(size * 2) / 3}
	viewBox="0 0 60 40"
	role="img"
	aria-hidden="true"
>
	{#if camp === 'france'}
		<rect width="20" height="40" fill="#21295c" />
		<rect x="20" width="20" height="40" fill="#f0f8ff" />
		<rect x="40" width="20" height="40" fill="#f53c1b" />
	{:else}
		<rect width="60" height="40" fill="#21295c" />
		<path d="M0 0L60 40M60 0L0 40" stroke="#f0f8ff" stroke-width="8" />
		<path d="M0 0L60 40M60 0L0 40" stroke="#f53c1b" stroke-width="3" />
		<path d="M30 0V40M0 20H60" stroke="#f0f8ff" stroke-width="13" />
		<path d="M30 0V40M0 20H60" stroke="#f53c1b" stroke-width="7" />
	{/if}
	<rect x="0.75" y="0.75" width="58.5" height="38.5" fill="none" stroke="#f0f8ff" stroke-width="1.5" />
</svg>

<style>
	.sb-badge {
		display: block;
		flex: none;
		border-radius: 3px;
	}
</style>
