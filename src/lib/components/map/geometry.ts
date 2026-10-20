export interface Point {
	x: number;
	y: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

const VECTORS: Record<Direction, Point> = {
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 },
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 }
};

/** Direction for an arrow key, or null for any other key. */
export function directionOfKey(key: string): Direction | null {
	switch (key) {
		case 'ArrowLeft':
			return 'left';
		case 'ArrowRight':
			return 'right';
		case 'ArrowUp':
			return 'up';
		case 'ArrowDown':
			return 'down';
		default:
			return null;
	}
}

/**
 * The id of the point nearest to `from` in direction `dir`, or null when
 * nothing lies that way. Only points inside a 90° cone around the direction
 * qualify; among them the one with the smallest distance, with sideways drift
 * penalised so a state straight ahead beats a slightly closer one off-axis.
 */
export function pickNeighbor(
	from: string,
	points: Readonly<Record<string, Point>>,
	dir: Direction,
	skip?: (id: string) => boolean
): string | null {
	const origin = points[from];
	if (!origin) return null;
	const v = VECTORS[dir];
	let best: string | null = null;
	let bestScore = Infinity;
	for (const id of Object.keys(points)) {
		if (id === from || skip?.(id)) continue;
		const dx = points[id].x - origin.x;
		const dy = points[id].y - origin.y;
		const along = dx * v.x + dy * v.y;
		const across = Math.abs(dx * v.y - dy * v.x);
		if (along <= 0 || across > along) continue;
		const score = along + 2 * across;
		if (score < bestScore) {
			bestScore = score;
			best = id;
		}
	}
	return best;
}
