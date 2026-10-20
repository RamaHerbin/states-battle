/**
 * The contract every part of States Battle codes against: the engine
 * (`engine.ts`), the AI (`ai.ts`), the map data (`$lib/map/data.ts`), the map
 * component and the screens. Change it only through the orchestrator.
 *
 * ## Rules
 *
 * Two camps, France and Great Britain, each hide a fleet of three troops on
 * their own copy of the map: the 48 contiguous states (DC is not playable).
 *
 * - A troop of size n occupies n distinct states that form one connected group
 *   through `Neighbors` (a size-3 troop may be a line or an L, any connected
 *   shape). Troops never share a state. The fleet is exactly `FLEET`: one
 *   troop of each size.
 * - Placement is secret. When both fleets are placed, the battle starts with
 *   `GameState.current` (chosen at `newGame`).
 * - On their turn a player fires at one state of the opponent's map they have
 *   not fired at yet. Outcomes:
 *   - `miss`: no troop there. `near` is true when at least one neighbour of the
 *     target holds a troop cell that has not been hit yet (the hint).
 *   - `hit`: a troop cell, and that troop still has unhit cells.
 *   - `unmasked`: the last unhit cell of a troop; the whole troop is revealed.
 * - Turns strictly alternate, whatever the outcome.
 * - The first player to unmask all three enemy troops wins; the game is over.
 */

/** USPS code of a playable state, e.g. `'CA'`. */
export type StateId = string;

export type Camp = 'france' | 'britain';

/** Index into `GameState.boards` / `GameState.camps`. */
export type PlayerId = 0 | 1;

export type TroopSize = 1 | 2 | 3;

/** One troop of each size, placed largest first by default. */
export const FLEET: readonly TroopSize[] = [3, 2, 1];

/** Undirected adjacency between playable states (shared border, not a point). */
export type Neighbors = Readonly<Record<StateId, readonly StateId[]>>;

export interface Troop {
	/** Stable within a game, e.g. `'t3'` for the size-3 troop. */
	id: string;
	size: TroopSize;
	/** `size` distinct, connected states. */
	cells: readonly StateId[];
}

export type ShotOutcome = 'miss' | 'hit' | 'unmasked';

export interface Shot {
	target: StateId;
	outcome: ShotOutcome;
	/** Only meaningful on a miss: an unhit troop cell borders the target. */
	near: boolean;
	/** Set on `hit` and `unmasked`. */
	troopId?: string;
	/** 1-based index of the shot in the whole game. */
	turn: number;
}

/** One player's map: their own troops and the shots the opponent fired at it. */
export interface Board {
	troops: readonly Troop[];
	shotsReceived: readonly Shot[];
}

export type Phase = 'placement' | 'battle' | 'over';

export interface GameState {
	phase: Phase;
	camps: readonly [Camp, Camp];
	boards: readonly [Board, Board];
	/** Whose turn it is to fire (or who starts, during placement). */
	current: PlayerId;
	/** Shots fired so far. */
	turn: number;
	winner: PlayerId | null;
}

/**
 * What a player may know about the opponent's board: only their own shots and
 * the troops they unmasked. The AI and the enemy map are fed this, never a
 * `Board`, so hidden troops cannot leak into the DOM or the AI.
 */
export interface FoggedBoard {
	shots: readonly Shot[];
	unmasked: readonly Troop[];
	/** Sizes of the troops not unmasked yet. */
	remaining: readonly TroopSize[];
}

/** Uniform in [0, 1). Seeded in tests and with `?seed=`. */
export interface Rng {
	next(): number;
}

export type PlacementError =
	| 'unknown-state'
	| 'size-mismatch'
	| 'not-connected'
	| 'overlap'
	| 'size-taken'
	| 'fleet-full';

export type AiLevel = 'easy' | 'normal' | 'hard';

/* ── Function contracts ──────────────────────────────────────────────────
   Implementations: engine.ts (all but the ai* ones), ai.ts (ai*), rng.ts. All
   pure: they never mutate their inputs and return new objects. */

/** `mulberry32`-style seeded generator. */
export type CreateRng = (seed: number) => Rng;

/** `null` when `troop` can be added to `board`, else why not. */
export type ValidatePlacement = (board: Board, troop: Troop, neighbors: Neighbors) => PlacementError | null;

/** Adds the troop; throws `Error(PlacementError)` when invalid. */
export type PlaceTroop = (board: Board, troop: Troop, neighbors: Neighbors) => Board;

/** A fresh game in `placement` with two empty boards. */
export type NewGame = (camps: readonly [Camp, Camp], first: PlayerId) => GameState;

/** Replaces one player's board during placement. */
export type SetBoard = (state: GameState, player: PlayerId, board: Board, neighbors: Neighbors) => GameState;

/** `placement` → `battle`; throws unless both fleets match `FLEET`. */
export type StartBattle = (state: GameState) => GameState;

/**
 * `state.current` fires at `target` on the other board. Throws when not in
 * `battle`, when the target is unknown or already shot.
 */
export type Fire = (state: GameState, target: StateId, neighbors: Neighbors) => { state: GameState; shot: Shot };

/** The view `viewer` has of the opponent's board. */
export type FogOf = (state: GameState, viewer: PlayerId) => FoggedBoard;

/** A complete valid fleet at random. */
export type AiPlace = (states: readonly StateId[], neighbors: Neighbors, rng: Rng) => Troop[];

/**
 * Next target, never one already shot. easy: random; normal: hunt/target
 * (fires around hits, uses `near` hints); hard: normal + probability density
 * over the remaining troop shapes.
 */
export type AiNextShot = (
	view: FoggedBoard,
	states: readonly StateId[],
	neighbors: Neighbors,
	rng: Rng,
	level: AiLevel
) => StateId;

/* ── Map contracts ─────────────────────────────────────────────────────── */

export interface StateInfo {
	id: StateId;
	nameFr: string;
	nameEn: string;
}

/** How a state is drawn by `UsMap.svelte`. */
export type CellState =
	| 'idle'
	| 'fog'
	| 'miss'
	| 'near'
	| 'hit'
	| 'unmasked'
	| 'troop'
	| 'preview'
	| 'invalid';
