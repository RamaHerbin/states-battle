import type { CreateRng } from './types';

/** mulberry32: a tiny, fast 32-bit seeded generator, uniform in [0, 1). */
export const createRng: CreateRng = (seed) => {
	let a = seed >>> 0;
	return {
		next() {
			a = (a + 0x6d2b79f5) >>> 0;
			let t = a;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		}
	};
};
