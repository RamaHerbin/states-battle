<script lang="ts">
	import { fr } from '$lib/content/fr';
	import type { TroopSize } from '$lib/game/types';
	import { FLEET } from '$lib/game/types';

	interface Props {
		/** Sizes still to place. */
		toPlace: readonly TroopSize[];
		/** The troop being built (a size from `toPlace`), or null when all are placed. */
		current: TroopSize | null;
		/** States selected so far for the current troop. */
		count: number;
		onpick: (size: TroopSize) => void;
		onundo: (size: TroopSize) => void;
	}

	let { toPlace, current, count, onpick, onundo }: Props = $props();

	const stateOf = (size: TroopSize) =>
		!toPlace.includes(size) ? 'placed' : size === current ? 'current' : 'todo';
</script>

<ul class="sb-tray" aria-label={fr.placement.trayLabel}>
	{#each FLEET as size (size)}
		{@const state = stateOf(size)}
		<li class="sb-troop sb-troop--{state}" data-size={size} data-state={state}>
			<button
				type="button"
				class="sb-troop__pick"
				aria-pressed={state === 'current'}
				disabled={state === 'placed'}
				onclick={() => onpick(size)}
			>
				<span class="sb-troop__pips" aria-hidden="true">
					{#each { length: size } as _, i (i)}
						<span class="sb-pip" class:sb-pip--on={state === 'placed' || (state === 'current' && i < count)}></span>
					{/each}
				</span>
				<span class="sb-troop__text">
					<span class="sb-troop__name">{fr.placement.troop[size]}</span>
					<span class="sb-troop__state"
						>{fr.placement.state[state]}{state === 'current' ? ` · ${count}/${size}` : ''}</span
					>
				</span>
			</button>
			{#if state === 'placed'}
				<button
					type="button"
					class="sb-troop__undo btn"
					aria-label={`${fr.placement.undo} : ${fr.placement.troop[size]}`}
					onclick={() => onundo(size)}>{fr.placement.undo}</button
				>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.sb-tray {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sb-troop {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}
	.sb-troop__pick {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 3.25rem;
		padding: 0.5rem 0.75rem;
		border: 2px solid color-mix(in srgb, var(--paper) 35%, transparent);
		border-radius: 0.25rem;
		background: color-mix(in srgb, var(--paper) 8%, transparent);
		color: var(--paper);
		text-align: left;
		cursor: pointer;
	}
	.sb-troop__pick:disabled {
		cursor: default;
		border-color: color-mix(in srgb, var(--paper) 22%, transparent);
	}
	.sb-troop--current .sb-troop__pick {
		border-color: var(--paper);
		background: color-mix(in srgb, var(--paper) 18%, transparent);
	}
	.sb-troop__pips {
		display: flex;
		gap: 3px;
		flex: none;
		width: 3.6rem;
	}
	.sb-pip {
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--paper);
		border-radius: 2px;
	}
	.sb-pip--on {
		background: var(--red);
		border-color: var(--red);
	}
	.sb-troop__text {
		display: grid;
		line-height: 1.1;
	}
	.sb-troop__name {
		font-family: var(--font-display);
		font-size: 1.5rem;
		text-transform: uppercase;
	}
	.sb-troop__state {
		font-size: 1rem;
		color: color-mix(in srgb, var(--paper) 88%, transparent);
	}
	.sb-troop__undo {
		font-size: 1.1rem;
	}
	.sb-troop__undo:hover,
	.sb-troop__pick:not(:disabled):hover {
		background: color-mix(in srgb, var(--paper) 22%, transparent);
	}
</style>
