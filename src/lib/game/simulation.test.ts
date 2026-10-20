/**
 * Whole games, AI against AI, on the real map and through the real engine:
 * the AI only ever sees `fogOf`, as it will in the app.
 */
import { describe, expect, it } from 'vitest';
import { NEIGHBORS, STATE_IDS } from '$lib/map/data';
import { aiNextShot, aiPlace } from './ai';
import { fire, fogOf, newGame, setBoard, startBattle } from './engine';
import { createRng } from './rng';
import type { AiLevel, PlayerId } from './types';

interface Result {
	winner: PlayerId;
	turns: number;
	/** Shots fired by the winner. */
	winnerShots: number;
}

function play(seed: number, levels: readonly [AiLevel, AiLevel]): Result {
	const rng = createRng(seed);
	let state = newGame(['france', 'britain'], (seed % 2) as PlayerId);
	for (const p of [0, 1] as const) {
		const troops = aiPlace(STATE_IDS, NEIGHBORS, rng);
		state = setBoard(state, p, { troops, shotsReceived: [] }, NEIGHBORS);
	}
	state = startBattle(state);
	const seen: [Set<string>, Set<string>] = [new Set(), new Set()];
	while (state.phase === 'battle') {
		const me = state.current;
		const target = aiNextShot(fogOf(state, me), STATE_IDS, NEIGHBORS, rng, levels[me]);
		expect(seen[me].has(target), `seed ${seed}: player ${me} fired twice at ${target}`).toBe(false);
		seen[me].add(target);
		state = fire(state, target, NEIGHBORS).state;
		expect(state.turn).toBeLessThanOrEqual(2 * STATE_IDS.length);
	}
	expect(state.phase).toBe('over');
	const winner = state.winner!;
	return { winner, turns: state.turn, winnerShots: seen[winner].size };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Shots player 0 needs to win alone: both sides play `level`, count its shots. */
function shotsToWin(level: AiLevel, games: number, offset: number): number[] {
	const out: number[] = [];
	for (let i = 0; i < games; i++) out.push(play(offset + i, [level, level]).winnerShots);
	return out;
}

describe('AI vs AI on the real map', () => {
	it('1 000 easy/normal games all finish, without repeated shots', () => {
		const levels: [AiLevel, AiLevel][] = [
			['easy', 'easy'],
			['normal', 'normal'],
			['easy', 'normal'],
			['normal', 'easy']
		];
		for (let i = 0; i < 1000; i++) play(i, levels[i % 4]);
	});

	it('normal beats easy most of the time', () => {
		let normalWins = 0;
		const n = 400;
		for (let i = 0; i < n; i++) {
			const normalSide = (i % 2) as PlayerId;
			const levels: [AiLevel, AiLevel] = normalSide === 0 ? ['normal', 'easy'] : ['easy', 'normal'];
			if (play(10_000 + i, levels).winner === normalSide) normalWins++;
		}
		process.stderr.write(`normal vs easy: normal wins ${((normalWins / n) * 100).toFixed(1)} %` + "\n");
		expect(normalWins / n).toBeGreaterThan(0.6);
	});

	it('hard finishes and needs no more shots than normal', { timeout: 120_000 }, () => {
		const normal = shotsToWin('normal', 60, 20_000);
		const hard = shotsToWin('hard', 60, 20_000);
		process.stderr.write(`shots to win: normal ${mean(normal).toFixed(1)}, hard ${mean(hard).toFixed(1)}` + "\n");
		expect(mean(hard)).toBeLessThanOrEqual(mean(normal) + 1);
	});
});
