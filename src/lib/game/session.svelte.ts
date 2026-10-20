/**
 * The running app: which screen is shown, the mode, the camp, and the game
 * itself. Screens read its fields and call its methods; they never touch the
 * engine or the AI directly. The engine stays the only source of rules.
 *
 * Player 0 is the human in `ai` mode (player 1 is the computer). In `local`
 * mode both are humans sharing the device: `viewer` is whoever is looking at
 * the screen, and `passDevice` hides both maps between turns.
 *
 * QA flags, read once by `init()` (same spirit as `?t=` in the other apps):
 *   ?seed=<n>                               deterministic game
 *   ?screen=home|camp|placement|battle|end  jump to a screen with a seeded game
 *   ?mode=ai|local
 *   ?level=easy|normal|hard
 */
import { NEIGHBORS, STATE_IDS } from '$lib/map/data';
import { aiNextShot, aiPlace } from './ai';
import { emptyBoard, fire, fogOf, newGame, setBoard, startBattle, validatePlacement } from './engine';
import { createRng } from './rng';
import type {
	AiLevel,
	Board,
	Camp,
	CellState,
	FoggedBoard,
	GameState,
	PlacementError,
	PlayerId,
	Rng,
	Shot,
	StateId,
	Troop,
	TroopSize
} from './types';
import { FLEET } from './types';

export type Screen = 'home' | 'camp' | 'placement' | 'battle' | 'end';
export type Mode = 'ai' | 'local';

export interface SessionFlags {
	seed: number | null;
	screen: Screen | null;
	mode: Mode | null;
	level: AiLevel | null;
}

const SCREENS: readonly Screen[] = ['home', 'camp', 'placement', 'battle', 'end'];
const LEVELS: readonly AiLevel[] = ['easy', 'normal', 'hard'];

export function parseFlags(params: URLSearchParams): SessionFlags {
	const seed = Number.parseInt(params.get('seed') ?? '', 10);
	const screen = params.get('screen') as Screen | null;
	const mode = params.get('mode');
	const level = params.get('level') as AiLevel | null;
	return {
		seed: Number.isFinite(seed) ? seed : null,
		screen: screen && SCREENS.includes(screen) ? screen : null,
		mode: mode === 'ai' || mode === 'local' ? mode : null,
		level: level && LEVELS.includes(level) ? level : null
	};
}

export const otherCamp = (camp: Camp): Camp => (camp === 'france' ? 'britain' : 'france');
const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);

export interface PlayerStats {
	shots: number;
	hits: number;
	unmasked: number;
	/** 0..1, 0 when no shot was fired. */
	accuracy: number;
}

/** A log line, newest last. `by` fired at the other player's map. */
export interface LogEntry {
	by: PlayerId;
	shot: Shot;
}

/** Cells of a player's own map: their troops and the opponent's shots. */
export function ownCells(board: Board): Partial<Record<StateId, CellState>> {
	const cells: Partial<Record<StateId, CellState>> = {};
	for (const t of board.troops) for (const c of t.cells) cells[c] = 'troop';
	const shot = new Set(board.shotsReceived.map((s) => s.target));
	for (const s of board.shotsReceived) {
		cells[s.target] = s.outcome === 'miss' ? (s.near ? 'near' : 'miss') : 'hit';
	}
	for (const t of board.troops) {
		if (t.cells.every((c) => shot.has(c))) for (const c of t.cells) cells[c] = 'unmasked';
	}
	return cells;
}

/** Cells of the enemy map as `view` allows: fog everywhere it has not fired. */
export function enemyCells(view: FoggedBoard): Partial<Record<StateId, CellState>> {
	const cells: Partial<Record<StateId, CellState>> = {};
	for (const id of STATE_IDS) cells[id] = 'fog';
	for (const s of view.shots) cells[s.target] = s.outcome === 'miss' ? (s.near ? 'near' : 'miss') : 'hit';
	for (const t of view.unmasked) for (const c of t.cells) cells[c] = 'unmasked';
	return cells;
}

export class Session {
	screen = $state<Screen>('home');
	mode = $state<Mode>('ai');
	/** Easy by default: normal wins in ~15 shots out of 48 in AI-vs-AI runs. */
	level = $state<AiLevel>('easy');
	/** Camp of player 0; player 1 gets the other one. */
	camp = $state<Camp>('france');
	seed = $state(Date.now() >>> 0);

	game = $state<GameState | null>(null);
	/** Who is placing during `placement`. */
	placer = $state<PlayerId>(0);
	/** The placer's fleet so far, not yet committed to the game. */
	draft = $state<Board>(emptyBoard());
	log = $state<LogEntry[]>([]);
	/** The computer is about to fire (`ai` mode). */
	aiThinking = $state(false);
	/** `local` mode: both maps hidden until the next player confirms. */
	passDevice = $state(false);

	/** Delay before the computer fires, in ms. 0 fires synchronously (tests, QA). */
	aiDelayMs = 700;

	#rng: Rng = createRng(this.seed);
	#timer: ReturnType<typeof setTimeout> | null = null;

	/* ── Derived views for the screens ─────────────────────────────────── */

	/** Whose eyes are on the screen. */
	viewer = $derived<PlayerId>(
		this.mode === 'ai' ? 0 : this.screen === 'placement' ? this.placer : (this.game?.current ?? 0)
	);
	viewerCamp = $derived<Camp>(this.viewer === 0 ? this.camp : otherCamp(this.camp));
	/** It is the viewer's turn to fire and nothing is blocking it. */
	canFire = $derived(
		this.game?.phase === 'battle' &&
			!this.aiThinking &&
			!this.passDevice &&
			(this.mode === 'local' || this.game.current === 0)
	);
	myBoard = $derived<Board | null>(this.game ? this.game.boards[this.viewer] : null);
	enemyView = $derived<FoggedBoard | null>(this.game ? fogOf(this.game, this.viewer) : null);
	myCells = $derived(this.myBoard ? ownCells(this.myBoard) : {});
	enemyCellsView = $derived(this.enemyView ? enemyCells(this.enemyView) : {});
	draftCells = $derived(ownCells(this.draft));
	/** Sizes still to place in the draft, in `FLEET` order. */
	toPlace = $derived<TroopSize[]>(FLEET.filter((s) => !this.draft.troops.some((t) => t.size === s)));
	lastShot = $derived<LogEntry | null>(this.log.at(-1) ?? null);
	winner = $derived<PlayerId | null>(this.game?.winner ?? null);

	stats(player: PlayerId): PlayerStats {
		const fired = this.log.filter((e) => e.by === player).map((e) => e.shot);
		const hits = fired.filter((s) => s.outcome !== 'miss').length;
		return {
			shots: fired.length,
			hits,
			unmasked: fired.filter((s) => s.outcome === 'unmasked').length,
			accuracy: fired.length ? hits / fired.length : 0
		};
	}

	/* ── Navigation ─────────────────────────────────────────────────────── */

	/** Reads the QA flags and jumps where they say. Call once on mount. */
	init(params: URLSearchParams) {
		const f = parseFlags(params);
		if (f.seed !== null) this.reseed(f.seed);
		if (f.mode) this.mode = f.mode;
		if (f.level) this.level = f.level;
		if (!f.screen || f.screen === 'home') return;
		if (f.screen === 'camp') return this.go('camp');
		const delay = this.aiDelayMs;
		this.aiDelayMs = 0;
		this.chooseCamp(this.camp);
		if (f.screen !== 'placement') {
			this.autoPlace();
			this.confirmPlacement();
			if (this.mode === 'local') {
				this.ackPassDevice();
				this.autoPlace();
				this.confirmPlacement();
			}
			this.passDevice = false;
		}
		if (f.screen === 'end') this.#autoplayToEnd();
		this.aiDelayMs = delay;
	}

	go(screen: Screen) {
		this.screen = screen;
	}

	/** Home → camp choice, with the chosen mode and level. */
	start(mode: Mode, level: AiLevel = this.level) {
		this.mode = mode;
		this.level = level;
		this.go('camp');
	}

	/** Camp chosen: a fresh game, player 0 starts placing. */
	chooseCamp(camp: Camp) {
		this.#clearTimer();
		this.camp = camp;
		const first: PlayerId = this.#rng.next() < 0.5 ? 0 : 1;
		this.game = newGame([camp, otherCamp(camp)], first);
		this.log = [];
		this.placer = 0;
		this.draft = emptyBoard();
		this.passDevice = false;
		this.aiThinking = false;
		this.go('placement');
	}

	/* ── Placement ──────────────────────────────────────────────────────── */

	/** Why `cells` can't be the next troop of `size`, or null when it can. */
	checkTroop(size: TroopSize, cells: readonly StateId[]): PlacementError | null {
		return validatePlacement(this.draft, { id: `t${size}`, size, cells }, NEIGHBORS);
	}

	/** Adds a troop to the draft. Returns the error and changes nothing when invalid. */
	placeTroop(size: TroopSize, cells: readonly StateId[]): PlacementError | null {
		const troop: Troop = { id: `t${size}`, size, cells: [...cells] };
		const error = validatePlacement(this.draft, troop, NEIGHBORS);
		if (!error) this.draft = { troops: [...this.draft.troops, troop], shotsReceived: [] };
		return error;
	}

	removeTroop(size: TroopSize) {
		this.draft = { troops: this.draft.troops.filter((t) => t.size !== size), shotsReceived: [] };
	}

	resetPlacement() {
		this.draft = emptyBoard();
	}

	/** Fills the draft with a random valid fleet (replaces what was placed). */
	autoPlace() {
		this.draft = { troops: aiPlace(STATE_IDS, NEIGHBORS, this.#rng), shotsReceived: [] };
	}

	/**
	 * Commits the draft. `ai` mode: the computer places and the battle starts.
	 * `local` mode: player 1 places next (behind `passDevice`), then battle.
	 */
	confirmPlacement() {
		if (!this.game || this.toPlace.length > 0) return;
		this.game = setBoard(this.game, this.placer, this.draft, NEIGHBORS);
		this.draft = emptyBoard();
		if (this.mode === 'local' && this.placer === 0) {
			this.placer = 1;
			this.passDevice = true;
			return;
		}
		if (this.mode === 'ai') {
			const troops = aiPlace(STATE_IDS, NEIGHBORS, this.#rng);
			this.game = setBoard(this.game, 1, { troops, shotsReceived: [] }, NEIGHBORS);
		}
		this.game = startBattle(this.game);
		this.go('battle');
		if (this.mode === 'local') this.passDevice = true;
		else this.#maybeAiTurn();
	}

	/* ── Battle ─────────────────────────────────────────────────────────── */

	/** The viewer fires at `target` on the enemy map. Null when not allowed. */
	fireAt(target: StateId): Shot | null {
		if (!this.canFire || !this.game) return null;
		if (this.enemyView?.shots.some((s) => s.target === target)) return null;
		const shot = this.#fire(target);
		if (this.game.phase === 'battle') {
			if (this.mode === 'local') this.passDevice = true;
			else this.#maybeAiTurn();
		}
		return shot;
	}

	/** `local` mode: the next player has the device. */
	ackPassDevice() {
		this.passDevice = false;
	}

	/* ── End ────────────────────────────────────────────────────────────── */

	/** Same mode, level and camp, new seed. */
	replay() {
		this.reseed((this.seed + 1) >>> 0);
		this.chooseCamp(this.camp);
	}

	home() {
		this.#clearTimer();
		this.game = null;
		this.log = [];
		this.passDevice = false;
		this.aiThinking = false;
		this.go('home');
	}

	reseed(seed: number) {
		this.seed = seed >>> 0;
		this.#rng = createRng(this.seed);
	}

	/* ── Internals ──────────────────────────────────────────────────────── */

	#fire(target: StateId): Shot {
		const by = this.game!.current;
		const { state, shot } = fire(this.game!, target, NEIGHBORS);
		this.game = state;
		this.log = [...this.log, { by, shot }];
		if (state.phase === 'over') this.go('end');
		return shot;
	}

	#maybeAiTurn() {
		if (this.mode !== 'ai' || this.game?.phase !== 'battle' || this.game.current !== 1) return;
		const shoot = () => {
			this.#timer = null;
			this.aiThinking = false;
			if (this.game?.phase !== 'battle' || this.game.current !== 1) return;
			const target = aiNextShot(fogOf(this.game, 1), STATE_IDS, NEIGHBORS, this.#rng, this.level);
			this.#fire(target);
		};
		if (this.aiDelayMs <= 0) return shoot();
		this.aiThinking = true;
		this.#timer = setTimeout(shoot, this.aiDelayMs);
	}

	#autoplayToEnd() {
		while (this.game?.phase === 'battle') {
			const me = this.game.current;
			const target = aiNextShot(fogOf(this.game, me), STATE_IDS, NEIGHBORS, this.#rng, 'normal');
			this.#fire(target);
		}
	}

	#clearTimer() {
		if (this.#timer) clearTimeout(this.#timer);
		this.#timer = null;
	}
}

export const session = new Session();
