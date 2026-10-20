import { FLEET } from './types';
import type {
	AiLevel,
	AiNextShot,
	AiPlace,
	FoggedBoard,
	Neighbors,
	Rng,
	Shot,
	StateId,
	Troop,
	TroopSize
} from './types';

const pickIndex = (rng: Rng, length: number): number => Math.min(length - 1, Math.floor(rng.next() * length));

/* ── Placement ─────────────────────────────────────────────────────────── */

/** Grows one connected troop of `size` from free states, or null when stuck. */
function growTroop(size: TroopSize, free: StateId[], used: Set<StateId>, neighbors: Neighbors, rng: Rng): StateId[] | null {
	const open = free.filter((s) => !used.has(s));
	if (open.length < size) return null;
	const cells = [open[pickIndex(rng, open.length)]];
	while (cells.length < size) {
		const frontier: StateId[] = [];
		for (const c of cells) {
			for (const n of neighbors[c] ?? []) {
				if (!used.has(n) && !cells.includes(n) && !frontier.includes(n) && free.includes(n)) frontier.push(n);
			}
		}
		if (frontier.length === 0) return null;
		cells.push(frontier[pickIndex(rng, frontier.length)]);
	}
	return cells;
}

export const aiPlace: AiPlace = (states, neighbors, rng) => {
	for (let attempt = 0; attempt < 200; attempt++) {
		const used = new Set<StateId>();
		const troops: Troop[] = [];
		let ok = true;
		for (const size of FLEET) {
			let cells: StateId[] | null = null;
			for (let t = 0; t < 20 && !cells; t++) cells = growTroop(size, [...states], used, neighbors, rng);
			if (!cells) {
				ok = false;
				break;
			}
			for (const c of cells) used.add(c);
			troops.push({ id: `t${size}`, size, cells });
		}
		if (ok) return troops;
	}
	throw new Error('aiPlace: no valid fleet fits this map');
};

/* ── Shooting ──────────────────────────────────────────────────────────── */

interface Evidence {
	shotAt: Map<StateId, Shot>;
	/** Hit cells whose troop is not unmasked yet. The fog hides which troop owns them. */
	openHits: StateId[];
	/** Neighbours of non-near misses: they cannot hold an unhit troop cell. */
	forbidden: Set<StateId>;
	nearMisses: Shot[];
	unshot: StateId[];
}

function gather(view: FoggedBoard, states: readonly StateId[], neighbors: Neighbors): Evidence {
	const shotAt = new Map<StateId, Shot>();
	for (const s of view.shots) shotAt.set(s.target, s);
	const unmaskedCells = new Set<StateId>();
	for (const t of view.unmasked) for (const c of t.cells) unmaskedCells.add(c);
	const openHits: StateId[] = [];
	const forbidden = new Set<StateId>();
	const nearMisses: Shot[] = [];
	for (const s of view.shots) {
		if (s.outcome === 'miss') {
			if (s.near) nearMisses.push(s);
			else for (const n of neighbors[s.target] ?? []) forbidden.add(n);
		} else if (!unmaskedCells.has(s.target)) {
			openHits.push(s.target);
		}
	}
	return { shotAt, openHits, forbidden, nearMisses, unshot: states.filter((s) => !shotAt.has(s)) };
}

/** Picks the best-scoring state, ties broken by the rng. */
function pickBest(candidates: readonly StateId[], score: (s: StateId) => number, rng: Rng): StateId {
	let best = -Infinity;
	let pool: StateId[] = [];
	for (const c of candidates) {
		const v = score(c);
		if (v > best) {
			best = v;
			pool = [c];
		} else if (v === best) pool.push(c);
	}
	return pool[pickIndex(rng, pool.length)];
}

/** A near miss is "explained" when a neighbour was hit after it was fired. */
function isExplained(miss: Shot, ev: Evidence, neighbors: Neighbors): boolean {
	return (neighbors[miss.target] ?? []).some((n) => {
		const s = ev.shotAt.get(n);
		return s !== undefined && s.outcome !== 'miss' && s.turn > miss.turn;
	});
}

function normalShot(ev: Evidence, neighbors: Neighbors, rng: Rng): StateId {
	// Target mode: finish the troops we have started.
	const hitCells = new Set<StateId>(ev.openHits);
	if (hitCells.size > 0) {
		const around = ev.unshot.filter((s) => (neighbors[s] ?? []).some((n) => hitCells.has(n)));
		if (around.length > 0) {
			return pickBest(around, (s) => (neighbors[s] ?? []).filter((n) => hitCells.has(n)).length, rng);
		}
	}
	// Hunt mode.
	const allowed = ev.unshot.filter((s) => !ev.forbidden.has(s));
	const pool = allowed.length > 0 ? allowed : ev.unshot;
	const pending = ev.nearMisses.filter((m) => !isExplained(m, ev, neighbors));
	const unshotSet = new Set(ev.unshot);
	return pickBest(
		pool,
		(s) => {
			const nb = neighbors[s] ?? [];
			const nearAdj = pending.filter((m) => nb.includes(m.target)).length;
			const open = nb.filter((n) => unshotSet.has(n)).length;
			return nearAdj * 100 + open + rng.next() * 0.5;
		},
		rng
	);
}

/** Every connected set of `maxSize` or fewer states inside `universe`, by size. */
function connectedSets(universe: readonly StateId[], neighbors: Neighbors, maxSize: number): StateId[][][] {
	const inU = new Set(universe);
	const bySize: StateId[][][] = [[], universe.map((s) => [s])];
	for (let k = 2; k <= maxSize; k++) {
		const seen = new Set<string>();
		const next: StateId[][] = [];
		for (const set of bySize[k - 1]) {
			for (const c of set) {
				for (const n of neighbors[c] ?? []) {
					if (!inU.has(n) || set.includes(n)) continue;
					const grown = [...set, n];
					const key = [...grown].sort().join('|');
					if (seen.has(key)) continue;
					seen.add(key);
					next.push(grown);
				}
			}
		}
		bySize.push(next);
	}
	return bySize;
}

const SAMPLES = 300;

function hardShot(view: FoggedBoard, ev: Evidence, neighbors: Neighbors, rng: Rng): StateId {
	const fallback = () => normalShot(ev, neighbors, rng);
	const sizes = [...view.remaining] as number[];
	if (sizes.length === 0) return fallback();

	const hits = new Set<StateId>(ev.openHits);
	const allowed = (s: StateId) => !ev.shotAt.has(s) && !ev.forbidden.has(s);
	const universe = new Set<StateId>(ev.unshot.filter(allowed));
	for (const h of hits) universe.add(h);
	const bySize = connectedSets([...universe], neighbors, Math.max(...sizes));
	// A troop with every cell hit would be unmasked: each needs an unhit cell.
	const cands = new Map<number, StateId[][]>();
	const holding = new Map<number, Map<StateId, StateId[][]>>();
	for (const size of new Set(sizes)) {
		const list = (bySize[size] ?? []).filter((set) => set.some((c) => !hits.has(c)));
		if (list.length === 0) return fallback();
		cands.set(size, list);
		const index = new Map<StateId, StateId[][]>();
		for (const set of list) for (const c of set) if (hits.has(c)) index.set(c, [...(index.get(c) ?? []), set]);
		holding.set(size, index);
	}

	// Near misses still need an unhit troop cell next to them, unless a later hit explains them.
	const needy = ev.nearMisses.filter((m) => !isExplained(m, ev, neighbors));
	const counts = new Map<StateId, number>();
	let accepted = 0;
	for (let i = 0; i < SAMPLES; i++) {
		const used = new Set<StateId>();
		const chosen: StateId[][] = [];
		const left = [...sizes];
		const uncovered = new Set(hits);
		let ok = true;
		const take = (set: StateId[], size: number) => {
			for (const c of set) {
				used.add(c);
				uncovered.delete(c);
			}
			chosen.push(set);
			left.splice(left.indexOf(size), 1);
		};
		const free = (set: StateId[]) => !set.some((c) => used.has(c));
		// Cover the open hits first: each uncovered hit joins a random remaining troop.
		while (uncovered.size > 0 && left.length > 0) {
			const pool = [...uncovered];
			const h = pool[pickIndex(rng, pool.length)];
			const size = left[pickIndex(rng, left.length)];
			const options = (holding.get(size)?.get(h) ?? []).filter(free);
			if (options.length === 0) {
				ok = false;
				break;
			}
			take(options[pickIndex(rng, options.length)], size);
		}
		if (!ok || uncovered.size > 0) continue;
		// Troops with no hit sit entirely on unshot, allowed states.
		for (const size of [...left]) {
			const options = (cands.get(size) ?? []).filter((set) => free(set) && !set.some((c) => hits.has(c)));
			if (options.length === 0) {
				ok = false;
				break;
			}
			take(options[pickIndex(rng, options.length)], size);
		}
		if (!ok) continue;
		const unhit = new Set<StateId>();
		for (const set of chosen) for (const c of set) if (!hits.has(c)) unhit.add(c);
		if (!needy.every((m) => (neighbors[m.target] ?? []).some((n) => unhit.has(n)))) continue;
		accepted++;
		for (const c of unhit) counts.set(c, (counts.get(c) ?? 0) + 1);
	}
	if (accepted === 0) return fallback();

	const candidates = ev.unshot.filter((s) => (counts.get(s) ?? 0) > 0);
	if (candidates.length === 0) return fallback();
	return pickBest(candidates, (s) => counts.get(s) ?? 0, rng);
}

export const aiNextShot: AiNextShot = (view, states, neighbors, rng, level: AiLevel) => {
	const ev = gather(view, states, neighbors);
	if (ev.unshot.length === 0) throw new Error('aiNextShot: every state has been shot');
	if (level === 'easy') return ev.unshot[pickIndex(rng, ev.unshot.length)];
	if (level === 'normal') return normalShot(ev, neighbors, rng);
	return hardShot(view, ev, neighbors, rng);
};
