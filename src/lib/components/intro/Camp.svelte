<script lang="ts">
	import { session } from '$lib/game/session.svelte';
	import { fr } from '$lib/content/fr';
	import type { Camp } from '$lib/game/types';

	const camps: { id: Camp; label: string }[] = [
		{ id: 'france', label: fr.camp.france },
		{ id: 'britain', label: fr.camp.britain }
	];
</script>

<section class="camp screen">
	<button type="button" class="camp__back btn btn--link" onclick={() => session.go('home')}>
		<span aria-hidden="true">←</span>
		{fr.camp.back}
	</button>

	<h1 class="camp__title screen-heading type-screen" tabindex="-1">{fr.camp.title}</h1>

	<ul class="camp__list">
		{#each camps as c}
			<li>
				<button
					type="button"
					class="camp__choice camp__choice--{c.id}"
					onclick={() => session.chooseCamp(c.id)}
				>
					<svg class="camp__emblem" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
						{#if c.id === 'france'}
							<rect width="40" height="80" fill="#1f3fae" />
							<rect x="40" width="40" height="80" fill="#f0f8ff" />
							<rect x="80" width="40" height="80" fill="#f53c1b" />
							<!-- fleur-de-lis -->
							<g fill="#e8b923" stroke="#21295c" stroke-width="1.5" stroke-linejoin="round">
								<path d="M60 14c7 8 8 17 0 26-8-9-7-18 0-26z" />
								<path d="M60 40c-4-9-14-12-22-8 3 7 11 9 17 7z" />
								<path d="M60 40c4-9 14-12 22-8-3 7-11 9-17 7z" />
								<path d="M52 42h16v5H52zM50 50h20v5H50z" />
							</g>
						{:else}
							<rect width="120" height="80" fill="#21295c" />
							<path d="M0 0L120 80M120 0L0 80" stroke="#f0f8ff" stroke-width="16" />
							<path d="M0 0L120 80M120 0L0 80" stroke="#f53c1b" stroke-width="5" />
							<path d="M60 0v80M0 40h120" stroke="#f0f8ff" stroke-width="26" />
							<path d="M60 0v80M0 40h120" stroke="#f53c1b" stroke-width="14" />
						{/if}
					</svg>
					<span class="camp__label">{c.label}</span>
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	.camp {
		min-height: 100dvh;
		display: grid;
		grid-template-rows: auto auto 1fr;
		justify-items: center;
		gap: clamp(1rem, 3vw, 2rem);
		background: var(--navy);
		max-width: none;
	}
	.camp__back {
		justify-self: start;
		padding-inline: 0;
		font-family: var(--font-body);
		font-size: 1.15rem;
		text-transform: none;
	}
	.camp__title {
		font-family: var(--font-display);
		font-size: clamp(2.75rem, 11vw, 6rem);
		color: var(--red);
		text-decoration: underline;
		text-underline-offset: 0.12em;
		text-align: center;
		text-wrap: balance;
	}
	.camp__list {
		width: min(100%, 60rem);
		min-width: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		align-content: center;
		gap: clamp(1rem, 3vw, 2rem);
		list-style: none;
		padding: 0;
	}
	.camp__choice {
		width: 100%;
		display: grid;
		justify-items: center;
		gap: 0.75rem;
		padding: clamp(1rem, 3vw, 1.75rem);
		border: 3px solid var(--paper);
		transition:
			transform 0.15s,
			background-color 0.15s;
	}
	.camp__choice:hover {
		background: rgb(240 248 255 / 0.1);
		transform: translateY(-4px);
	}
	.camp__emblem {
		width: min(100%, 14rem);
		height: auto;
		border: 2px solid var(--paper);
	}
	.camp__label {
		font-family: var(--font-display);
		font-size: clamp(2rem, 6vw, 3rem);
		line-height: 1;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	@media (prefers-reduced-motion: reduce) {
		.camp__choice {
			transition: none;
		}
		.camp__choice:hover {
			transform: none;
		}
	}
</style>
