<script lang="ts">
	import { fr } from '$lib/content/fr';
	import { session } from '$lib/game/session.svelte';
	import { campName, fmt } from './format';

	const mine = $derived(session.canFire && session.mode === 'ai');
</script>

<div
	class="turn-banner flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-2 {mine || session.mode === 'local'
		? 'border-(--paper)/60 bg-(--red-solid)'
		: 'border-white/20 bg-white/10'}"
	data-turn={session.mode === 'local' ? 'local' : mine ? 'you' : 'enemy'}
>
	<h2 class="banner-title type-panel">
		{#if session.mode === 'local'}
			{fmt(fr.battle.campTurn, { camp: campName(session.viewerCamp) })}
		{:else if mine}
			{fr.battle.yourTurn}
		{:else}
			{fr.battle.enemyTurn}
		{/if}
	</h2>
	{#if session.aiThinking}
		<span class="thinking flex items-center gap-2 text-base">
			<span class="dots flex gap-1" aria-hidden="true">
				<span class="dot"></span><span class="dot"></span><span class="dot"></span>
			</span>
			{fr.battle.thinking}
		</span>
	{:else if session.canFire}
		<span class="text-base">{fr.battle.firePrompt}</span>
	{/if}
</div>

<style>
	.dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 9999px;
		background: var(--paper);
		animation: think 1s infinite ease-in-out;
	}
	.dot:nth-child(2) {
		animation-delay: 0.15s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes think {
		0%,
		100% {
			opacity: 0.25;
		}
		50% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
