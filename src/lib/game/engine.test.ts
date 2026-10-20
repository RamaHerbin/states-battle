import { describe, expect, it } from 'vitest';
import {
	emptyBoard,
	fire,
	fogOf,
	isConnected,
	newGame,
	placeTroop,
	setBoard,
	startBattle,
	validatePlacement
} from './engine';
import type { Board, GameState, Neighbors, Troop } from './types';

/** A corner of the real map: shared borders only (no Four Corners points). */
const N: Neighbors = {
	WA: ['OR', 'ID'],
	OR: ['WA', 'ID', 'NV', 'CA'],
	CA: ['OR', 'NV', 'AZ'],
	NV: ['OR', 'ID', 'UT', 'AZ', 'CA'],
	ID: ['WA', 'OR', 'NV', 'UT', 'WY', 'MT'],
	MT: ['ID', 'WY'],
	WY: ['MT', 'ID', 'UT', 'CO'],
	UT: ['ID', 'WY', 'CO', 'AZ', 'NV'],
	AZ: ['CA', 'NV', 'UT', 'NM'],
	CO: ['WY', 'UT', 'NM'],
	NM: ['AZ', 'CO']
};

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const v of Object.values(value)) deepFreeze(v);
	}
	return value;
}

const troop = (size: 1 | 2 | 3, cells: string[], id = `t${size}`): Troop => ({ id, size, cells });

/** Fleets used through the battle tests. */
const FLEET0 = [troop(3, ['WA', 'OR', 'CA']), troop(2, ['MT', 'WY']), troop(1, ['NM'])];
const FLEET1 = [troop(3, ['NV', 'UT', 'CO']), troop(2, ['WA', 'OR']), troop(1, ['MT'])];

const fleetBoard = (troops: Troop[]): Board => troops.reduce((b, t) => placeTroop(b, t, N), emptyBoard());

function battle(first: 0 | 1 = 0): GameState {
	let s = newGame(['france', 'britain'], first);
	s = setBoard(s, 0, fleetBoard(FLEET0), N);
	s = setBoard(s, 1, fleetBoard(FLEET1), N);
	return deepFreeze(startBattle(s));
}

/** Fires each target in turn, players alternating from `state.current`. */
function play(state: GameState, targets: string[]): GameState {
	return targets.reduce((s, t) => fire(s, t, N).state, state);
}

describe('isConnected', () => {
	it('accepts lines and L-shapes', () => {
		expect(isConnected(['WA', 'OR', 'CA'], N)).toBe(true);
		expect(isConnected(['CA', 'NV', 'UT'], N)).toBe(true);
		expect(isConnected(['WA', 'ID', 'MT'], N)).toBe(true);
	});
	it('rejects disjoint sets, point contacts and the empty set', () => {
		expect(isConnected(['WA', 'CA'], N)).toBe(false);
		expect(isConnected(['UT', 'NM'], N)).toBe(false);
		expect(isConnected(['AZ', 'CO'], N)).toBe(false);
		expect(isConnected([], N)).toBe(false);
	});
	it('accepts a single cell', () => {
		expect(isConnected(['NM'], N)).toBe(true);
	});
});

describe('validatePlacement / placeTroop', () => {
	const empty = deepFreeze(emptyBoard());

	it('accepts a valid troop, including an L-shape', () => {
		expect(validatePlacement(empty, troop(3, ['OR', 'NV', 'UT']), N)).toBeNull();
		expect(validatePlacement(empty, troop(3, ['CA', 'AZ', 'NM']), N)).toBeNull();
	});

	it.each([
		['unknown-state', troop(1, ['DC'])],
		['unknown-state', troop(2, ['TX', 'NM'])],
		['size-mismatch', troop(3, ['WA', 'OR'])],
		['size-mismatch', troop(2, ['WA', 'WA'])],
		['size-mismatch', { id: 't4', size: 4, cells: ['WA', 'OR', 'CA', 'NV'] } as unknown as Troop],
		['not-connected', troop(2, ['WA', 'CA'])],
		['not-connected', troop(3, ['WA', 'CA', 'NM'])],
		['not-connected', troop(2, ['UT', 'NM'])]
	])('returns %s', (code, t) => {
		expect(validatePlacement(empty, deepFreeze(t), N)).toBe(code);
		expect(() => placeTroop(empty, t, N)).toThrow(new Error(code));
	});

	it('detects overlap, size-taken and fleet-full', () => {
		const one = placeTroop(empty, troop(3, ['WA', 'OR', 'CA']), N);
		expect(validatePlacement(one, troop(2, ['CA', 'NV']), N)).toBe('overlap');
		expect(validatePlacement(one, troop(3, ['UT', 'CO', 'NM']), N)).toBe('size-taken');
		const full = fleetBoard(FLEET0);
		expect(validatePlacement(full, troop(1, ['UT'], 'x'), N)).toBe('fleet-full');
		expect(() => placeTroop(full, troop(1, ['UT'], 'x'), N)).toThrow('fleet-full');
	});

	it('returns a new board and never mutates its inputs', () => {
		const t = deepFreeze(troop(2, ['ID', 'MT']));
		const next = placeTroop(empty, t, N);
		expect(next).not.toBe(empty);
		expect(empty.troops).toHaveLength(0);
		expect(next.troops).toEqual([t]);
		expect(next.troops[0]).not.toBe(t);
	});
});

describe('newGame / setBoard / startBattle', () => {
	it('starts in placement with empty boards', () => {
		const s = newGame(['britain', 'france'], 1);
		expect(s).toEqual({
			phase: 'placement',
			camps: ['britain', 'france'],
			boards: [emptyBoard(), emptyBoard()],
			current: 1,
			turn: 0,
			winner: null
		});
	});

	it('setBoard replaces one board and validates it', () => {
		const s = deepFreeze(newGame(['france', 'britain'], 0));
		const next = setBoard(s, 1, fleetBoard(FLEET1), N);
		expect(next.boards[1].troops).toEqual(FLEET1);
		expect(next.boards[0]).toBe(s.boards[0]);
		expect(s.boards[1].troops).toHaveLength(0);
		const bad: Board = { troops: [FLEET0[0], troop(2, ['CA', 'NV'])], shotsReceived: [] };
		expect(() => setBoard(s, 0, bad, N)).toThrow('overlap');
	});

	it('setBoard refuses outside placement', () => {
		expect(() => setBoard(battle(), 0, emptyBoard(), N)).toThrow(/placement/);
	});

	it('startBattle requires both complete fleets', () => {
		let s = deepFreeze(newGame(['france', 'britain'], 0));
		expect(() => startBattle(s)).toThrow(/player 0/);
		s = deepFreeze(setBoard(s, 0, fleetBoard(FLEET0), N));
		expect(() => startBattle(s)).toThrow(/player 1/);
		s = deepFreeze(setBoard(s, 1, fleetBoard(FLEET1.slice(0, 2)), N));
		expect(() => startBattle(s)).toThrow(/player 1/);
		s = setBoard(s, 1, fleetBoard(FLEET1), N);
		const b = startBattle(s);
		expect(b.phase).toBe('battle');
		expect(b.current).toBe(0);
		expect(() => startBattle(b)).toThrow(/placement/);
	});
});

describe('fire', () => {
	it('refuses outside battle', () => {
		const s = newGame(['france', 'britain'], 0);
		expect(() => fire(s, 'WA', N)).toThrow(/not in battle/);
	});

	it('refuses unknown and already-shot targets', () => {
		const s = battle();
		expect(() => fire(s, 'DC', N)).toThrow(/unknown target/);
		const after = play(s, ['WA', 'CA']); // 0 shoots WA, 1 shoots CA
		expect(() => fire(after, 'WA', N)).toThrow(/already shot/);
		// the other player may still fire at the same state on their own map
		expect(() => fire(play(s, ['WA']), 'WA', N)).not.toThrow();
	});

	it('scores a miss with the near hint', () => {
		const s = battle(1); // player 1 fires at board 0: WA OR CA / MT WY / NM
		const { shot } = fire(s, 'ID', N); // ID borders WA, OR, MT, WY
		expect(shot).toEqual({ target: 'ID', outcome: 'miss', near: true, turn: 1 });
	});

	it('near is false when no unhit troop cell borders the target', () => {
		// board 1 troops: NV UT CO / WA OR / MT. AZ borders NV, UT → near.
		// Kill the t3 first, then AZ is not near anymore.
		let s = battle(0);
		s = play(s, ['NV', 'WA', 'UT', 'OR', 'CO', 'CA']);
		const { shot } = fire(s, 'AZ', N);
		expect(shot).toMatchObject({ outcome: 'miss', near: false });
		const s2 = play(battle(0), ['NV', 'WA']);
		expect(fire(s2, 'AZ', N).shot.near).toBe(true); // UT still unhit
	});

	it('reports hit, then unmasked, with the troop id', () => {
		const s = battle(0);
		const r1 = fire(s, 'WA', N);
		expect(r1.shot).toEqual({ target: 'WA', outcome: 'hit', near: false, troopId: 't2', turn: 1 });
		const s2 = fire(r1.state, 'ID', N).state; // player 1 misses
		const r2 = fire(s2, 'OR', N);
		expect(r2.shot).toMatchObject({ target: 'OR', outcome: 'unmasked', troopId: 't2', turn: 3 });
		expect(fire(r2.state, 'NV', N).shot.outcome).toBe('miss');
		expect(fire(play(s, ['MT']), 'WY', N).shot.outcome).toBe('hit');
		expect(fire(s, 'MT', N).shot.outcome).toBe('unmasked');
	});

	it('alternates turns whatever the outcome and records shots on the opponent board', () => {
		const s = battle(1);
		const r = fire(s, 'WA', N); // player 1 hits board 0
		expect(r.state.current).toBe(0);
		expect(r.state.turn).toBe(1);
		expect(r.state.boards[0].shotsReceived).toEqual([r.shot]);
		expect(r.state.boards[1].shotsReceived).toEqual([]);
		const r2 = fire(r.state, 'NV', N); // player 0 hits board 1
		expect(r2.state.current).toBe(1);
		expect(r2.state.turn).toBe(2);
		expect(r2.state.boards[1].shotsReceived).toEqual([r2.shot]);
	});

	it('never mutates the input state', () => {
		const s = battle();
		const copy = structuredClone(s);
		play(s, ['WA', 'CA', 'OR', 'NV']);
		expect(s).toEqual(copy);
	});

	it('detects the win and ends the game', () => {
		// player 0 unmasks NV UT CO / WA OR / MT; player 1 misses in between
		const kills = ['NV', 'UT', 'CO', 'WA', 'OR', 'MT'];
		const misses = ['ID', 'UT', 'NV', 'AZ', 'CO'];
		let s = battle(0);
		for (let i = 0; i < kills.length; i++) {
			const r = fire(s, kills[i], N);
			s = r.state;
			if (i < kills.length - 1) {
				expect(s.phase).toBe('battle');
				s = fire(s, misses[i], N).state;
			}
		}
		expect(s.phase).toBe('over');
		expect(s.winner).toBe(0);
		expect(s.turn).toBe(11);
		expect(() => fire(s, 'AZ', N)).toThrow(/not in battle/);
	});
});

describe('fogOf', () => {
	it('shows nothing of a fresh board but the remaining sizes', () => {
		expect(fogOf(battle(), 0)).toEqual({ shots: [], unmasked: [], remaining: [3, 2, 1] });
	});

	it('only reveals unmasked troops, and never hidden cells', () => {
		// player 0: hit NV (t3), unmask MT (t1), miss ID
		const s = play(battle(0), ['NV', 'ID', 'MT', 'AZ', 'ID']);
		const fog = fogOf(s, 0);
		expect(fog.unmasked).toEqual([troop(1, ['MT'])]);
		expect(fog.remaining).toEqual([3, 2]);
		expect(fog.shots.map((x) => x.target)).toEqual(['NV', 'MT', 'ID']);
		const json = JSON.stringify(fog);
		for (const hidden of ['UT', 'CO', 'WA', 'OR', 't2', 't3']) expect(json).not.toContain(`"${hidden}"`);
		expect(fog.shots[0]).toEqual({ target: 'NV', outcome: 'hit', near: false, turn: 1 });
	});

	it('is the view of the opponent board for each viewer', () => {
		const s = play(battle(0), ['NV', 'WA']);
		expect(fogOf(s, 0).shots.map((x) => x.target)).toEqual(['NV']);
		expect(fogOf(s, 1).shots.map((x) => x.target)).toEqual(['WA']);
		expect(JSON.stringify(fogOf(s, 1))).not.toContain('"CA"');
	});

	it('returns copies, not references into the state', () => {
		const s = play(battle(0), ['MT']);
		const fog = fogOf(s, 0);
		expect(fog.unmasked[0]).not.toBe(s.boards[1].troops[2]);
		expect(fog.shots[0]).not.toBe(s.boards[1].shotsReceived[0]);
	});
});
