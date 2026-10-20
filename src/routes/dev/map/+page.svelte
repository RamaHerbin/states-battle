<script lang="ts">
	import UsMap from '$lib/components/map/UsMap.svelte';
	import { FEATURES, NATION, STATES, STATE_IDS, VIEWBOX } from '$lib/map/data';
	import type { CellState, StateId } from '$lib/game/types';

	const ORDER: CellState[] = ['idle', 'fog', 'miss', 'near', 'hit', 'unmasked', 'troop', 'preview', 'invalid'];

	// Cycle every state through the CellStates so each look is on screen at once.
	let cells = $state<Record<StateId, CellState>>(
		Object.fromEntries(STATE_IDS.map((id, i) => [id, ORDER[i % ORDER.length]]))
	);
	let selected = $state<StateId | null>(null);
	let hovered = $state<StateId | null>(null);
	let interactive = $state(true);

	function select(id: StateId) {
		selected = id;
		cells[id] = ORDER[(ORDER.indexOf(cells[id] ?? 'idle') + 1) % ORDER.length];
	}
</script>

<main class="mx-auto max-w-5xl p-4">
	<h1 class="text-xl font-bold text-(--navy)">UsMap — QA</h1>
	<p class="my-2 text-sm">
		Sélection : <b data-testid="selected">{selected ?? '—'}</b> · Survol :
		<b data-testid="hovered">{hovered ?? '—'}</b>
		<label class="ml-4"><input type="checkbox" bind:checked={interactive} /> interactif</label>
	</p>
	<ul class="mb-3 flex flex-wrap gap-2 text-xs">
		{#each ORDER as c (c)}<li class="rounded bg-(--navy) px-2 py-0.5 text-(--paper)">{c}</li>{/each}
	</ul>
	<UsMap
		features={FEATURES}
		nation={NATION}
		viewBox={VIEWBOX}
		{cells}
		names={STATES}
		{interactive}
		label="Carte des États-Unis, démo de tous les états de cellule"
		disabled={(id) => id === 'WY'}
		onselect={select}
		onhover={(id) => (hovered = id)}
	/>
</main>
