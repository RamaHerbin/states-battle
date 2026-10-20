import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

const draw = (seed: number, n: number) => {
	const rng = createRng(seed);
	return Array.from({ length: n }, () => rng.next());
};

describe('createRng', () => {
	it('is deterministic for a given seed', () => {
		expect(draw(42, 20)).toEqual(draw(42, 20));
	});

	it('differs between seeds', () => {
		expect(draw(1, 5)).not.toEqual(draw(2, 5));
	});

	it('stays in [0, 1)', () => {
		for (const x of draw(123, 10_000)) {
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThan(1);
		}
	});

	it('is roughly uniform', () => {
		const xs = draw(7, 10_000);
		const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
		expect(mean).toBeGreaterThan(0.48);
		expect(mean).toBeLessThan(0.52);
	});

	it('accepts zero, negative and fractional seeds', () => {
		for (const seed of [0, -5, 3.7]) expect(draw(seed, 3)).toEqual(draw(seed, 3));
	});
});
