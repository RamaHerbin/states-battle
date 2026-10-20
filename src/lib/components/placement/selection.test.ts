import { describe, expect, it } from 'vitest';
import { canExtend, fill, keepConnected } from './selection';

const N = { A: ['B'], B: ['A', 'C'], C: ['B'], D: [] };

describe('selection', () => {
	it('accepts any first state, then only neighbours', () => {
		expect(canExtend([], 'D', N)).toBe(true);
		expect(canExtend(['A'], 'B', N)).toBe(true);
		expect(canExtend(['A'], 'C', N)).toBe(false);
	});

	it('drops states cut off from the first one', () => {
		expect(keepConnected(['A', 'C'], N)).toEqual(['A']);
		expect(keepConnected(['A', 'B', 'C'], N)).toEqual(['A', 'B', 'C']);
		expect(keepConnected([], N)).toEqual([]);
	});

	it('fills placeholders', () => {
		expect(fill('{n}/{size}', { n: 1, size: 2 })).toBe('1/2');
	});
});
