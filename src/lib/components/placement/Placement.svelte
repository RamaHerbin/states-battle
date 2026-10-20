<script lang="ts">
	import { untrack } from 'svelte';
	import UsMap from '$lib/components/map/UsMap.svelte';
	import { fr } from '$lib/content/fr';
	import { session } from '$lib/game/session.svelte';
	import type { CellState, PlacementError, StateId, TroopSize } from '$lib/game/types';
	import { FEATURES, NATION, NEIGHBORS, STATES, VIEWBOX } from '$lib/map/data';
	import CampBadge from './CampBadge.svelte';
	import FleetTray from './FleetTray.svelte';
	import PassDevice from './PassDevice.svelte';
	import { canExtend, fill, keepConnected } from './selection';

	const campName = (camp: 'france' | 'britain') => fr.camp[camp];

	/** Troop the player picked in the tray; the largest one left otherwise. */
	let picked = $state<TroopSize | null>(null);
	let selection = $state<StateId[]>([]);
	let hovered = $state<StateId | null>(null);
	let error = $state<PlacementError | null>(null);
	let justPlaced = $state<TroopSize | null>(null);

	const size = $derived<TroopSize | null>(
		picked && session.toPlace.includes(picked) ? picked : (session.toPlace[0] ?? null)
	);
	const occupied = $derived(new Set(Object.keys(session.draftCells)));
	const allPlaced = $derived(session.toPlace.length === 0);

	// Any change of the troop being built (pick, placement, auto, reset, new placer) starts clean.
	$effect(() => {
		size;
		untrack(() => {
			selection = [];
			error = null;
		});
	});

	/** Would adding `id` to the selection be accepted? */
	function acceptable(id: StateId): PlacementError | null {
		if (size === null) return 'fleet-full';
		if (occupied.has(id)) return 'overlap';
		if (!canExtend(selection, id, NEIGHBORS)) return 'not-connected';
		const next = [...selection, id];
		return next.length === size ? session.checkTroop(size, next) : null;
	}

	const cells = $derived.by(() => {
		const out: Partial<Record<StateId, CellState>> = { ...session.draftCells };
		for (const id of selection) out[id] = 'preview';
		if (hovered && size !== null && !selection.includes(hovered) && !occupied.has(hovered)) {
			out[hovered] = acceptable(hovered) ? 'invalid' : 'preview';
		}
		return out;
	});

	function onselect(id: StateId) {
		if (size === null) return;
		justPlaced = null;
		if (selection.includes(id)) {
			selection = keepConnected(
				selection.filter((s) => s !== id),
				NEIGHBORS
			);
			error = null;
			return;
		}
		const problem = acceptable(id);
		if (problem) {
			error = problem;
			return;
		}
		const next = [...selection, id];
		if (next.length < size) {
			selection = next;
			error = null;
			return;
		}
		const placing = size;
		const failed = session.placeTroop(placing, next);
		error = failed;
		if (!failed) {
			justPlaced = placing;
			hovered = null;
		}
	}

	function pick(s: TroopSize) {
		justPlaced = null;
		picked = s;
		selection = [];
		error = null;
	}

	function undo(s: TroopSize) {
		session.removeTroop(s);
		pick(s);
	}

	function reset() {
		session.resetPlacement();
		pick(3);
	}

	function auto() {
		justPlaced = null;
		session.autoPlace();
		picked = null;
	}

	const status = $derived(
		error
			? fr.placement.errors[error]
			: size === null
				? fr.placement.allPlaced
				: fill(fr.placement.status, { size, n: selection.length })
	);
	const placedNote = $derived(justPlaced ? fill(fr.placement.placedStatus, { size: justPlaced }) : '');
</script>

<section class="sb-placement screen" aria-labelledby="sb-placement-title" inert={session.passDevice}>
	<header class="sb-placement__head">
		<div class="sb-placement__camp">
			<CampBadge camp={session.viewerCamp} size={54} />
			<span class="sb-placement__camp-name">{fill(fr.placement.campLabel, { camp: campName(session.viewerCamp) })}</span>
		</div>
		<h1 id="sb-placement-title" class="sb-placement__title type-screen screen-heading" tabindex="-1">{fr.placement.title}</h1>
		<p class="sb-placement__intro">{fr.placement.intro} {fr.placement.fleet}</p>
	</header>

	<div class="sb-placement__body">
		<div class="sb-placement__tray">
			<FleetTray toPlace={session.toPlace} current={size} count={selection.length} onpick={pick} onundo={undo} />
			<p class="sb-placement__hint">{fr.placement.hint}</p>
			<div class="sb-placement__live" aria-live="polite" aria-atomic="true">
				<p class="sb-placement__status" class:sb-placement__status--error={error !== null}>{placedNote} {status}</p>
			</div>
		</div>

		<div class="sb-placement__map">
			<UsMap
				features={FEATURES}
				nation={NATION}
				viewBox={VIEWBOX}
				{cells}
				names={STATES}
				interactive={size !== null}
				label={fr.placement.mapLabel}
				{onselect}
				onhover={(id) => (hovered = id)}
			/>
		</div>

		<div class="sb-placement__actions">
			<button type="button" class="btn sb-btn sb-btn--ghost sb-placement__auto" onclick={auto}>{fr.placement.auto}</button>
			<button type="button" class="btn sb-btn sb-btn--ghost sb-placement__reset" onclick={reset}>{fr.placement.reset}</button>
			<button
				type="button"
				class="btn btn--primary sb-btn sb-btn--primary sb-placement__ready"
				disabled={!allPlaced}
				onclick={() => session.confirmPlacement()}>{fr.placement.ready}</button
			>
		</div>
	</div>
</section>

{#if session.mode === 'local' && session.passDevice}
	<PassDevice
		title={fill(fr.placement.passTitle, { camp: campName(session.viewerCamp) })}
		text={fr.placement.passText}
		camp={session.viewerCamp}
		cta={fr.placement.passCta}
		onconfirm={() => session.ackPassDevice()}
	/>
{/if}

<style>
	.sb-placement {
		display: grid;
		gap: 1rem;
		max-width: 80rem;
		overflow-x: clip;
		--map-max-h: calc(100dvh - 2rem);
	}
	.sb-placement__camp {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.sb-placement__intro {
		max-width: 46rem;
		margin-top: 0.4rem;
		font-size: 1.15rem;
	}
	.sb-placement__body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-areas: 'map' 'tray' 'actions';
		gap: 1rem;
		min-width: 0;
	}
	.sb-placement__map {
		grid-area: map;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--paper) 10%, var(--navy));
	}
	.sb-placement__tray {
		grid-area: tray;
		display: grid;
		gap: 0.75rem;
		align-content: start;
		min-width: 0;
	}
	.sb-placement__actions {
		grid-area: actions;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-content: start;
	}
	.sb-placement__hint {
		font-size: 1rem;
		color: color-mix(in srgb, var(--paper) 85%, transparent);
	}
	.sb-placement__status {
		min-height: 2.6rem;
		padding: 0.4rem 0.6rem;
		border-left: 4px solid var(--paper);
		background: color-mix(in srgb, var(--paper) 10%, transparent);
		font-size: 1.1rem;
	}
	.sb-placement__status--error {
		border-color: var(--red);
		background: color-mix(in srgb, var(--red) 25%, var(--navy));
	}
	.sb-btn--primary {
		flex: 1 1 100%;
	}
	.sb-btn--ghost {
		flex: 1 1 auto;
	}
	@media (min-width: 1024px), (orientation: landscape) and (max-height: 560px) {
		.sb-placement__body {
			grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
			grid-template-areas: 'map tray' 'map actions';
			grid-template-rows: auto 1fr;
			align-items: start;
		}
	}
	/* Phone in landscape: the map must fit under a one-line header. */
	@media (orientation: landscape) and (max-height: 560px) {
		.sb-placement {
			gap: 0.5rem;
			--map-max-h: calc(100dvh - 8.5rem);
		}
		.sb-placement__head {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			column-gap: 1rem;
		}
		.sb-placement__camp {
			margin-bottom: 0;
		}
		.sb-placement__title {
			font-size: 2.25rem;
		}
		.sb-placement__intro {
			flex-basis: 100%;
			max-width: none;
			margin-top: 0.1rem;
			font-size: 0.95rem;
			line-height: 1.25;
		}
	}
	@media (min-width: 1024px) {
		.sb-placement {
			--map-max-h: calc(100dvh - 11rem);
		}
	}
</style>
