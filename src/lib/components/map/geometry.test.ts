import { describe, expect, it } from 'vitest';
import { directionOfKey, pickNeighbor, type Point } from './geometry';

const pts: Record<string, Point> = {
	C: { x: 100, y: 100 },
	E: { x: 160, y: 100 },
	E2: { x: 300, y: 100 },
	W: { x: 40, y: 105 },
	N: { x: 100, y: 40 },
	S: { x: 95, y: 170 },
	NE: { x: 150, y: 50 },
	far: { x: 100, y: 400 }
};

describe('pickNeighbor', () => {
	it('picks the nearest point in each direction', () => {
		expect(pickNeighbor('C', pts, 'right')).toBe('E');
		expect(pickNeighbor('C', pts, 'left')).toBe('W');
		expect(pickNeighbor('C', pts, 'up')).toBe('N');
		expect(pickNeighbor('C', pts, 'down')).toBe('S');
	});

	it('returns null when nothing lies that way', () => {
		expect(pickNeighbor('E2', pts, 'right')).toBeNull();
		expect(pickNeighbor('N', { N: pts.N, E: pts.E }, 'up')).toBeNull();
	});

	it('ignores points outside the 90° cone', () => {
		expect(pickNeighbor('C', { C: pts.C, X: { x: 110, y: 300 } }, 'right')).toBeNull();
	});

	it('prefers the aligned point over a closer off-axis one', () => {
		const p = { C: pts.C, aligned: { x: 200, y: 100 }, diag: { x: 150, y: 148 } };
		expect(pickNeighbor('C', p, 'right')).toBe('aligned');
	});

	it('skips excluded ids and unknown origins', () => {
		expect(pickNeighbor('C', pts, 'right', (id) => id === 'E')).toBe('NE');
		expect(pickNeighbor('nope', pts, 'right')).toBeNull();
	});
});

describe('directionOfKey', () => {
	it('maps arrows only', () => {
		expect(directionOfKey('ArrowUp')).toBe('up');
		expect(directionOfKey('Enter')).toBeNull();
	});
});
