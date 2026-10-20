<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { session } from '$lib/game/session.svelte';
	import { fr } from '$lib/content/fr';
	import Home from '$lib/components/intro/Home.svelte';
	import Camp from '$lib/components/intro/Camp.svelte';
	import Placement from '$lib/components/placement/Placement.svelte';
	import Battle from '$lib/components/battle/Battle.svelte';
	import End from '$lib/components/end/End.svelte';
	import Motion from '$lib/motion/Motion.svelte';

	onMount(() => session.init(page.url.searchParams));

	// Move focus to the new screen's heading (not on the initial load).
	let firstRun = true;
	$effect(() => {
		session.screen;
		if (firstRun) {
			firstRun = false;
			return;
		}
		tick().then(() => {
			const h = document.querySelector<HTMLElement>('main .screen-heading, main h1');
			h?.focus({ preventScroll: true });
		});
	});
</script>

<svelte:head>
	<title>{fr.meta.title}</title>
</svelte:head>

<Motion />

<main>
{#if session.screen === 'home'}
	<Home />
{:else if session.screen === 'camp'}
	<Camp />
{:else if session.screen === 'placement'}
	<Placement />
{:else if session.screen === 'battle'}
	<Battle />
{:else}
	<End />
{/if}
</main>

<style>
	:global(.screen-heading:focus:not(:focus-visible)) {
		outline: none;
	}
</style>
