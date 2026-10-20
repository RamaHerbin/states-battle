<script lang="ts">
	import type { Camp } from '$lib/game/types';
	import CampBadge from './CampBadge.svelte';

	interface Props {
		/** Headline, e.g. "Passe l'appareil à la France". */
		title: string;
		/** Whose turn it is: drives the badge and colours. */
		camp: Camp;
		/** Label of the confirm button. */
		cta: string;
		onconfirm: () => void;
		/** Optional line under the title. */
		text?: string;
	}

	let { title, camp, cta, onconfirm, text }: Props = $props();

	let button = $state<HTMLButtonElement>();
	$effect(() => button?.focus());
</script>

<div class="sb-pass sb-pass--{camp}" role="dialog" aria-modal="true" aria-labelledby="sb-pass-title">
	<div class="sb-pass__card">
		<CampBadge {camp} size={96} />
		<h2 id="sb-pass-title" class="sb-pass__title type-screen">{title}</h2>
		{#if text}<p class="sb-pass__text">{text}</p>{/if}
		<button type="button" class="sb-pass__cta btn btn--primary btn--lg" bind:this={button} onclick={onconfirm}>{cta}</button>
	</div>
</div>

<style>
	.sb-pass {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		overflow-y: auto;
		background: var(--navy);
		color: var(--paper);
		text-align: center;
	}
	.sb-pass__card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		max-width: 28rem;
	}
	.sb-pass__text {
		font-size: 1.2rem;
	}
	.sb-pass__cta {
		margin-top: 0.5rem;
	}
	@media (prefers-reduced-motion: no-preference) {
		.sb-pass {
			animation: sb-pass-in 0.25s ease-out;
		}
		@keyframes sb-pass-in {
			from {
				opacity: 0;
			}
		}
	}
</style>
