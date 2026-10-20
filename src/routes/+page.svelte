<script lang="ts">
	import { onMount } from 'svelte';
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
</script>

<svelte:head>
	<title>{fr.meta.title}</title>
</svelte:head>

<Motion />

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
