/** Pure helpers for the motion layer: no DOM, no gsap. */
import type { ShotOutcome } from '$lib/game/types';

export type MapSide = 'enemy' | 'mine';

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Reduced motion keeps opacity-only fades, never longer than this. */
export const REDUCED_MAX_S = 0.15;

export const MAP_SELECTOR: Record<MapSide, string> = {
	enemy: '.enemy-map',
	mine: '.my-map'
};

/** The path of a state inside a map wrapper. State ids are USPS codes; refuse anything else. */
export function stateSelector(id: string): string {
	if (!/^[A-Za-z]{2}$/.test(id)) throw new Error(`bad state id: ${id}`);
	return `path.state[data-id="${id}"]`;
}

/** Clamp a duration: untouched normally, opacity-only and short under reduced motion. */
export function duration(seconds: number, reduced: boolean): number {
	return reduced ? Math.min(seconds, REDUCED_MAX_S) : seconds;
}

/** Which map the shot lands on. In AI mode the human (player 0) fires on the enemy map. */
export function sideOf(by: 0 | 1, mode: 'ai' | 'local'): MapSide {
	if (mode === 'ai') return by === 0 ? 'enemy' : 'mine';
	return 'enemy';
}

export type ImpactKind = 'none' | 'near' | 'hit' | 'unmasked' | 'miss';

export interface ImpactPlan {
	kind: ImpactKind;
	pulse: boolean;
	ripple: boolean;
	shake: boolean;
}

/** What a shot animates. Reduced motion never moves anything (no pulse, ripple or shake). */
export function impactPlan(outcome: ShotOutcome, near: boolean, reduced: boolean): ImpactPlan {
	const kind: ImpactKind = outcome === 'miss' ? (near ? 'near' : 'miss') : outcome;
	if (reduced) return { kind, pulse: false, ripple: false, shake: false };
	return {
		kind,
		pulse: true,
		ripple: outcome !== 'miss' || near,
		shake: outcome === 'unmasked'
	};
}

/** Count-up value at progress p in [0,1], rounded to the stat's precision. */
export function countValue(target: number, p: number, decimals = 0): number {
	const k = 10 ** decimals;
	return Math.round(target * Math.min(1, Math.max(0, p)) * k) / k;
}
