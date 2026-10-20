/**
 * The pure rules of States Battle (see `types.ts`). Every function returns new
 * objects and never mutates its inputs; no DOM, no Svelte.
 */
import {
	FLEET,
	type Board,
	type Camp,
	type Fire,
	type FogOf,
	type GameState,
	type Neighbors,
	type NewGame,
	type PlaceTroop,
	type PlacementError,
	type PlayerId,
	type SetBoard,
	type Shot,
	type ShotOutcome,
	type StartBattle,
	type StateId,
	type Troop,
	type TroopSize,
	type ValidatePlacement
} from './types';

export const emptyBoard = (): Board => ({ troops: [], shotsReceived: [] });

/** True when `cells` is non-empty and forms one group through `neighbors`. */
export function isConnected(cells: readonly StateId[], neighbors: Neighbors): boolean {
	if (cells.length === 0) return false;
	const set = new Set(cells);
	const seen = new Set<StateId>([cells[0]]);
	const queue: StateId[] = [cells[0]];
	while (queue.length > 0) {
		const cell = queue.shift()!;
		for (const next of neighbors[cell] ?? []) {
			if (set.has(next) && !seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	}
	return seen.size === set.size;
}

const isKnown = (id: StateId, neighbors: Neighbors) => Object.hasOwn(neighbors, id);

/**
 * Checks, in order: the troop itself (unknown-state, size-mismatch,
 * not-connected), then its fit on the board (fleet-full, size-taken, overlap).
 */
export const validatePlacement: ValidatePlacement = (board, troop, neighbors) => {
	if (troop.cells.some((c) => !isKnown(c, neighbors))) return 'unknown-state';
	if (!FLEET.includes(troop.size) || troop.cells.length !== troop.size || new Set(troop.cells).size !== troop.size) {
		return 'size-mismatch';
	}
	if (!isConnected(troop.cells, neighbors)) return 'not-connected';
	if (board.troops.length >= FLEET.length) return 'fleet-full';
	if (board.troops.some((t) => t.size === troop.size)) return 'size-taken';
	const taken = new Set(board.troops.flatMap((t) => t.cells));
	if (troop.cells.some((c) => taken.has(c))) return 'overlap';
	return null;
};

const copyTroop = (troop: Troop): Troop => ({ id: troop.id, size: troop.size, cells: [...troop.cells] });

export const placeTroop: PlaceTroop = (board, troop, neighbors) => {
	const error: PlacementError | null = validatePlacement(board, troop, neighbors);
	if (error) throw new Error(error);
	return { troops: [...board.troops, copyTroop(troop)], shotsReceived: [...board.shotsReceived] };
};

export const newGame: NewGame = (camps: readonly [Camp, Camp], first: PlayerId) => ({
	phase: 'placement',
	camps: [camps[0], camps[1]],
	boards: [emptyBoard(), emptyBoard()],
	current: first,
	turn: 0,
	winner: null
});

const withBoard = (boards: GameState['boards'], player: PlayerId, board: Board): GameState['boards'] =>
	player === 0 ? [board, boards[1]] : [boards[0], board];

/** Re-places every troop of `board` on an empty one, so it is validated as a whole. */
export const setBoard: SetBoard = (state, player, board, neighbors) => {
	if (state.phase !== 'placement') throw new Error(`setBoard: not in placement (phase is ${state.phase})`);
	const rebuilt = board.troops.reduce((b, t) => placeTroop(b, t, neighbors), emptyBoard());
	return { ...state, boards: withBoard(state.boards, player, rebuilt) };
};

const sortedSizes = (troops: readonly Troop[]) => troops.map((t) => t.size).sort();
const isFullFleet = (board: Board) => sortedSizes(board.troops).join() === [...FLEET].sort().join();

export const startBattle: StartBattle = (state) => {
	if (state.phase !== 'placement') throw new Error(`startBattle: not in placement (phase is ${state.phase})`);
	state.boards.forEach((board, player) => {
		if (!isFullFleet(board)) throw new Error(`startBattle: player ${player} fleet is incomplete`);
	});
	return { ...state, phase: 'battle' };
};

const shotTargets = (board: Board) => new Set(board.shotsReceived.map((s) => s.target));
const isUnmasked = (troop: Troop, shot: Set<StateId>) => troop.cells.every((c) => shot.has(c));

export const fire: Fire = (state, target, neighbors) => {
	if (state.phase !== 'battle') throw new Error(`fire: not in battle (phase is ${state.phase})`);
	if (!isKnown(target, neighbors)) throw new Error(`fire: unknown target '${target}'`);
	const shooter = state.current;
	const defender: PlayerId = shooter === 0 ? 1 : 0;
	const board = state.boards[defender];
	const shot = shotTargets(board);
	if (shot.has(target)) throw new Error(`fire: '${target}' was already shot`);
	shot.add(target);

	const troop = board.troops.find((t) => t.cells.includes(target));
	let outcome: ShotOutcome = 'miss';
	let near = false;
	if (troop) {
		outcome = isUnmasked(troop, shot) ? 'unmasked' : 'hit';
	} else {
		const live = new Set(board.troops.flatMap((t) => t.cells).filter((c) => !shot.has(c)));
		near = (neighbors[target] ?? []).some((n) => live.has(n));
	}

	const turn = state.turn + 1;
	const newShot: Shot = troop ? { target, outcome, near, troopId: troop.id, turn } : { target, outcome, near, turn };
	const newBoard: Board = { troops: board.troops, shotsReceived: [...board.shotsReceived, newShot] };
	const won = board.troops.every((t) => isUnmasked(t, shot));

	const next: GameState = {
		...state,
		boards: withBoard(state.boards, defender, newBoard),
		turn,
		phase: won ? 'over' : 'battle',
		winner: won ? shooter : null,
		current: won ? shooter : defender
	};
	return { state: next, shot: { ...newShot } };
};

/**
 * Hidden troops never leave the engine: `unmasked` holds only fully shot
 * troops, and `troopId` is dropped from `hit` shots (it would tell which hits
 * belong together, hence the size of the troop being hit).
 */
export const fogOf: FogOf = (state, viewer) => {
	const board = state.boards[viewer === 0 ? 1 : 0];
	const shot = shotTargets(board);
	const unmasked: Troop[] = [];
	const remaining: TroopSize[] = [];
	for (const troop of board.troops) {
		if (isUnmasked(troop, shot)) unmasked.push(copyTroop(troop));
		else remaining.push(troop.size);
	}
	const shots = board.shotsReceived.map(({ troopId, ...rest }): Shot =>
		rest.outcome === 'unmasked' && troopId !== undefined ? { ...rest, troopId } : rest
	);
	return { shots, unmasked, remaining };
};
