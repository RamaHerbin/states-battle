import { describe, expect, it } from 'vitest';
import type { CellState } from '$lib/game/types';
import { CELL_LABELS, rovingTarget, stateLabel } from './labels';

describe('stateLabel', () => {
	it('names the state and its readable cell state', () => {
		expect(stateLabel('Texas', 'troop')).toBe('Texas — ta troupe');
		expect(stateLabel('Ohio', 'hit')).toBe('Ohio — touché');
		expect(stateLabel('Iowa', 'near')).toBe('Iowa — manqué, troupe à proximité');
	});

	it('has a distinct label for every cell state', () => {
		const cells: CellState[] = ['idle', 'fog', 'miss', 'near', 'hit', 'unmasked', 'troop', 'preview', 'invalid'];
		expect(new Set(cells.map((c) => CELL_LABELS[c])).size).toBe(cells.length);
	});
});

describe('rovingTarget', () => {
	const ids = ['AL', 'AZ', 'CA'] as const;
	const none = () => false;

	it('keeps the last focused state, even a now-disabled one', () => {
		expect(rovingTarget(ids, 'AZ', (id) => id === 'AZ')).toBe('AZ');
	});
	it('falls back to the first enabled state', () => {
		expect(rovingTarget(ids, null, (id) => id === 'AL')).toBe('AZ');
		expect(rovingTarget(ids, 'TX', none)).toBe('AL');
	});
	it('falls back to the first state when all are disabled, null when empty', () => {
		expect(rovingTarget(ids, null, () => true)).toBe('AL');
		expect(rovingTarget([], null, none)).toBeNull();
	});
});
