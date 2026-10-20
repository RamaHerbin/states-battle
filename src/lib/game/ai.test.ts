import { describe, expect, it } from 'vitest';
import { aiNextShot, aiPlace } from './ai';
import { NEIGHBORS, STATE_IDS } from '$lib/map/data';
import { fire, fogOf, newGame, setBoard, startBattle } from './engine';
import { createRng } from './rng';
import { FLEET } from './types';
import type { AiLevel, FoggedBoard, Neighbors, Rng, Shot, StateId, Troop } from './types';

/** Local mulberry32 so this file does not depend on rng.ts. */
const seeded = (seed: number): Rng => {
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

const fromEdges = (edges: string): Neighbors => {
	const map: Record<string, string[]> = {};
	for (const e of edges.trim().split(/\s+/)) {
		const [a, b] = e.split('-');
		(map[a] ??= []).push(b);
		(map[b] ??= []).push(a);
	}
	return map;
};

// 3x3 grid A B C / D E F / G H I.
const GRID = fromEdges('A-B B-C D-E E-F G-H H-I A-D D-G B-E E-H C-F F-I');
const WEST = fromEdges(
	`WA-OR WA-ID OR-ID OR-CA OR-NV CA-NV CA-AZ ID-NV ID-UT ID-WY ID-MT NV-UT NV-AZ UT-AZ UT-WY UT-CO
	 AZ-NM MT-WY MT-ND MT-SD WY-CO WY-NE WY-SD CO-NM CO-NE CO-KS ND-SD SD-NE NE-KS`
);
const FIXTURES: [string, Neighbors][] = [
	['grid', GRID],
	['west', WEST]
];
const LEVELS: AiLevel[] = ['easy', 'normal', 'hard'];

const statesOf = (n: Neighbors): StateId[] => Object.keys(n);

const isConnected = (cells: readonly StateId[], n: Neighbors): boolean => {
	const seen = new Set([cells[0]]);
	const queue = [cells[0]];
	while (queue.length) {
		const c = queue.pop()!;
		for (const x of n[c]) if (cells.includes(x) && !seen.has(x)) (seen.add(x), queue.push(x));
	}
	return seen.size === cells.length;
};

const shot = (target: StateId, outcome: Shot['outcome'], turn: number, extra: Partial<Shot> = {}): Shot => ({
	target,
	outcome,
	near: false,
	turn,
	...extra
});

const view = (shots: Shot[], unmasked: Troop[] = []): FoggedBoard => ({
	shots,
	unmasked,
	remaining: FLEET.filter((s) => !unmasked.some((t) => t.size === s))
});

/** Tiny hidden-board referee, just enough to feed the AI. */
function play(troops: Troop[], n: Neighbors, rng: Rng, level: AiLevel, states: StateId[]) {
	const hit = new Set<StateId>();
	const shots: Shot[] = [];
	const unmasked: Troop[] = [];
	const cellTroop = new Map<StateId, Troop>();
	for (const t of troops) for (const c of t.cells) cellTroop.set(c, t);
	while (shots.length < states.length) {
		const v: FoggedBoard = {
			shots,
			unmasked,
			remaining: troops.filter((t) => !unmasked.includes(t)).map((t) => t.size)
		};
		const target = aiNextShot(v, states, n, rng, level);
		if (shots.some((s) => s.target === target)) throw new Error(`repeat ${target}`);
		const troop = cellTroop.get(target);
		if (!troop) {
			const near = n[target].some((x) => cellTroop.has(x) && !hit.has(x));
			shots.push(shot(target, 'miss', shots.length + 1, { near }));
		} else {
			hit.add(target);
			const done = troop.cells.every((c) => hit.has(c));
			if (done) unmasked.push(troop);
			shots.push(shot(target, done ? 'unmasked' : 'hit', shots.length + 1, done ? { troopId: troop.id } : {}));
		}
	}
	return shots;
}

describe.each(FIXTURES)('aiPlace on %s', (_name, n) => {
	it('builds a valid fleet for 500 seeds', () => {
		const states = statesOf(n);
		for (let seed = 1; seed <= 500; seed++) {
			const fleet = aiPlace(states, n, seeded(seed));
			expect(fleet.map((t) => t.id)).toEqual(['t3', 't2', 't1']);
			const all = fleet.flatMap((t) => t.cells);
			expect(new Set(all).size).toBe(all.length);
			for (const t of fleet) {
				expect(t.cells).toHaveLength(t.size);
				expect(t.size).toBe(Number(t.id.slice(1)));
				expect(isConnected(t.cells, n)).toBe(true);
				for (const c of t.cells) expect(states).toContain(c);
			}
		}
	});

	it('is deterministic for a seed', () => {
		const states = statesOf(n);
		expect(aiPlace(states, n, seeded(7))).toEqual(aiPlace(states, n, seeded(7)));
	});
});

describe.each(FIXTURES)('aiNextShot on %s', (_name, n) => {
	const states = statesOf(n);

	it.each(LEVELS)('%s fires at every state once, whatever the fleet', (level) => {
		for (let seed = 1; seed <= 25; seed++) {
			const rng = seeded(seed);
			const troops = aiPlace(states, n, rng);
			const shots = play(troops, n, rng, level, states);
			expect(new Set(shots.map((s) => s.target)).size).toBe(states.length);
		}
	});

	it.each(LEVELS)('%s is deterministic for a seed', (level) => {
		const troops = aiPlace(states, n, seeded(3));
		const a = play(troops, n, seeded(11), level, states).map((s) => s.target);
		const b = play(troops, n, seeded(11), level, states).map((s) => s.target);
		expect(a).toEqual(b);
	});
});

describe('target mode (west)', () => {
	const states = statesOf(WEST);
	const open = view([shot('KS', 'hit', 1)]);

	it.each(['normal', 'hard'] as const)('%s fires next to an open hit', (level) => {
		for (let seed = 1; seed <= 30; seed++) {
			expect(WEST.KS).toContain(aiNextShot(open, states, WEST, seeded(seed), level));
		}
	});

	it('prefers a state touching two hits', () => {
		const v = view([shot('WY', 'hit', 1, {}), shot('NE', 'hit', 2, {})]);
		// CO and SD both touch WY and NE.
		for (let seed = 1; seed <= 20; seed++) {
			expect(['CO', 'SD']).toContain(aiNextShot(v, states, WEST, seeded(seed), 'normal'));
		}
	});

	it('ignores hits of unmasked troops', () => {
		const t1: Troop = { id: 't1', size: 1, cells: ['KS'] };
		const v = view([shot('KS', 'unmasked', 1, { troopId: 't1' }), shot('WA', 'hit', 2, {})], [t1]);
		for (const level of ['normal', 'hard'] as const) {
			for (let seed = 1; seed <= 30; seed++) {
				expect(WEST.WA).toContain(aiNextShot(v, states, WEST, seeded(seed), level));
			}
		}
	});
});

describe('hunt mode (west)', () => {
	const states = statesOf(WEST);

	it('avoids neighbours of a non-near miss', () => {
		const v = view([shot('CO', 'miss', 1, { near: false })]);
		for (const level of ['normal', 'hard'] as const) {
			for (let seed = 1; seed <= 40; seed++) {
				const t = aiNextShot(v, states, WEST, seeded(seed), level);
				expect(WEST.CO).not.toContain(t);
			}
		}
	});

	it('looks around a near miss', () => {
		const v = view([shot('CO', 'miss', 1, { near: true })]);
		const twoAway = new Set([...WEST.CO, ...WEST.CO.flatMap((x) => WEST[x])]);
		for (let seed = 1; seed <= 40; seed++) {
			expect(WEST.CO).toContain(aiNextShot(v, states, WEST, seeded(seed), 'normal'));
			// A troop of 2-3 cells may reach the near cell from further out.
			expect(twoAway.has(aiNextShot(v, states, WEST, seeded(seed), 'hard'))).toBe(true);
		}
	});

	it('hard stays fast', () => {
		const v = view([shot('CO', 'miss', 1, { near: true }), shot('WA', 'miss', 2, { near: false })]);
		const start = performance.now();
		for (let seed = 1; seed <= 50; seed++) aiNextShot(v, states, WEST, seeded(seed), 'hard');
		expect((performance.now() - start) / 50).toBeLessThan(20);
	});
});

/** Plays `level` against the real engine, returning each call's duration and the fogged views. */
function playEngine(seed: number, level: AiLevel, onShot?: (before: FoggedBoard, target: StateId, after: Shot) => void) {
	const rng = createRng(seed);
	const enemy = aiPlace(STATE_IDS, NEIGHBORS, rng);
	let state = newGame(['france', 'britain'], 0);
	state = setBoard(state, 0, { troops: aiPlace(STATE_IDS, NEIGHBORS, rng), shotsReceived: [] }, NEIGHBORS);
	state = setBoard(state, 1, { troops: enemy, shotsReceived: [] }, NEIGHBORS);
	state = startBattle(state);
	const times: number[] = [];
	// Player 0 is the AI; player 1's shots are skipped by firing the AI's turns only.
	while (state.phase === 'battle') {
		const view = fogOf(state, state.current);
		const start = performance.now();
		const target = aiNextShot(view, STATE_IDS, NEIGHBORS, rng, level);
		times.push(performance.now() - start);
		const res = fire(state, target, NEIGHBORS);
		onShot?.(view, target, res.shot);
		state = res.state;
	}
	return times;
}

describe('against the real engine (fogged hits carry no troopId)', () => {
	it('normal fires next to an open hit as soon as there is one', () => {
		let checked = 0;
		for (let seed = 1; seed <= 20; seed++) {
			playEngine(seed, 'normal', (view, target) => {
				expect(view.shots.every((x) => x.outcome === 'unmasked' || x.troopId === undefined)).toBe(true);
				const done = new Set(view.unmasked.flatMap((t) => t.cells));
				const shotCells = new Set(view.shots.map((x) => x.target));
				const hits = view.shots.filter((x) => x.outcome !== 'miss' && !done.has(x.target)).map((x) => x.target);
				const reachable = hits.some((h) => NEIGHBORS[h].some((n) => !shotCells.has(n)));
				if (reachable) {
					expect(hits.some((h) => NEIGHBORS[h].includes(target))).toBe(true);
					checked++;
				}
			});
		}
		expect(checked).toBeGreaterThan(0);
	});

	it('hard stays under 20 ms per call on the real map', () => {
		const all: number[] = [];
		for (let seed = 1; seed <= 5; seed++) all.push(...playEngine(seed, 'hard'));
		const avg = all.reduce((a, b) => a + b, 0) / all.length;
		const max = Math.max(...all);
		process.stderr.write(`hard ms/call: avg ${avg.toFixed(2)}, max ${max.toFixed(2)} over ${all.length} calls\n`);
		expect(avg).toBeLessThan(20);
		expect(max).toBeLessThan(100);
	});
});
