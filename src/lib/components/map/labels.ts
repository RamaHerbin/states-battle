import type { CellState, StateId } from '$lib/game/types';

/** Readable state of a cell, for screen readers. Only describes what the screen passed to the map. */
export const CELL_LABELS: Record<CellState, string> = {
	idle: 'libre',
	fog: 'inconnu',
	miss: 'manqué',
	near: 'manqué, troupe à proximité',
	hit: 'touché',
	unmasked: 'troupe démasquée',
	troop: 'ta troupe',
	preview: 'aperçu du placement',
	invalid: 'placement impossible'
};

/** e.g. "Texas — ta troupe". */
export function stateLabel(name: string, cell: CellState): string {
	return `${name} — ${CELL_LABELS[cell]}`;
}

/**
 * The roving tab stop: the last focused state when it still exists, else the first enabled one,
 * else the first one.
 */
export function rovingTarget(
	ids: readonly StateId[],
	last: StateId | null,
	isDisabled: (id: StateId) => boolean
): StateId | null {
	if (last && ids.includes(last)) return last;
	return ids.find((id) => !isDisabled(id)) ?? ids[0] ?? null;
}
