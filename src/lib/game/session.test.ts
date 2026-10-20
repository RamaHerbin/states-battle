import { describe, expect, it } from 'vitest';
import { STATE_IDS } from '$lib/map/data';
import { Session, enemyCells, flagsAllowed, ownCells } from './session.svelte';

function seeded(params = '') {
	const s = new Session();
	s.aiDelayMs = 0;
	s.init(new URLSearchParams(`seed=7&${params}`));
	return s;
}

describe('Session', () => {
	it('plays a whole game against the computer', () => {
		const s = seeded();
		s.start('ai', 'easy');
		expect(s.screen).toBe('camp');
		s.chooseCamp('britain');
		expect(s.screen).toBe('placement');
		expect(s.game?.camps).toEqual(['britain', 'france']);
		s.autoPlace();
		expect(s.toPlace).toEqual([]);
		s.confirmPlacement();
		expect(s.screen).toBe('battle');
		for (const id of STATE_IDS) {
			if (s.screen !== 'battle') break;
			if (!s.enemyView!.shots.some((x) => x.target === id)) s.fireAt(id);
		}
		expect(s.screen).toBe('end');
		expect(s.winner).not.toBeNull();
		const st = s.stats(0);
		expect(st.shots).toBeGreaterThan(0);
		expect(st.accuracy).toBeGreaterThan(0);
	});

	it('refuses an invalid troop and keeps the draft', () => {
		const s = seeded('screen=placement');
		expect(s.placeTroop(2, ['CA', 'NY'])).toBe('not-connected');
		expect(s.draft.troops).toHaveLength(0);
		expect(s.placeTroop(2, ['CA', 'OR'])).toBeNull();
		expect(s.placeTroop(1, ['OR'])).toBe('overlap');
		s.removeTroop(2);
		expect(s.toPlace).toEqual([3, 2, 1]);
	});

	it('local mode shows the shooter their result, then hides the maps on pass', () => {
		const s = seeded('mode=local&screen=battle');
		expect(s.screen).toBe('battle');
		expect(s.passDevice).toBe(false);
		const shooter = s.viewer;
		const target = STATE_IDS.find((id) => s.enemyCellsView[id] === 'fog')!;
		s.fireAt(target);
		// Result step: still the shooter's view, with the new mark, no cover yet.
		expect(s.handoff).toBe(true);
		expect(s.passDevice).toBe(false);
		expect(s.canFire).toBe(false);
		expect(s.viewer).toBe(shooter);
		expect(s.enemyCellsView[target]).not.toBe('fog');
		expect(s.myBoard).toEqual(s.game!.boards[shooter]);
		expect(s.fireAt(STATE_IDS.find((id) => s.enemyCellsView[id] === 'fog')!)).toBeNull();
		s.finishTurn();
		expect(s.handoff).toBe(false);
		expect(s.passDevice).toBe(true);
		expect(s.canFire).toBe(false);
		s.ackPassDevice();
		expect(s.viewer).not.toBe(shooter);
		expect(s.canFire).toBe(true);
	});

	it('local mode skips the cover when the last placer also fires first', () => {
		let skipped = 0;
		let covered = 0;
		for (let seed = 1; seed <= 12; seed++) {
			const s = new Session();
			s.init(new URLSearchParams(`seed=${seed}&mode=local`));
			s.chooseCamp('france');
			s.autoPlace();
			s.confirmPlacement();
			s.ackPassDevice();
			s.autoPlace();
			s.confirmPlacement();
			expect(s.screen).toBe('battle');
			if (s.game!.current === 1) {
				expect(s.passDevice).toBe(false);
				skipped++;
			} else {
				expect(s.passDevice).toBe(true);
				covered++;
			}
		}
		expect(skipped).toBeGreaterThan(0);
		expect(covered).toBeGreaterThan(0);
	});

	it('honours QA flags everywhere but the production host', () => {
		expect(flagsAllowed(false, 'states-battle.vercel.app')).toBe(false);
		expect(flagsAllowed(true, 'states-battle.vercel.app')).toBe(true);
		expect(flagsAllowed(false, 'states-battle-git-x.vercel.app')).toBe(true);
		expect(flagsAllowed(false, 'localhost')).toBe(true);
		expect(flagsAllowed(false, '')).toBe(true);
	});

	it('same seed and same human actions give the same game, however often auto is pressed', () => {
		const play = (autoPresses: number) => {
			const s = seeded();
			s.chooseCamp('france');
			for (let i = 0; i < autoPresses; i++) s.autoPlace();
			s.draft = { troops: [], shotsReceived: [] };
			s.placeTroop(3, ['CA', 'OR', 'WA']);
			s.placeTroop(2, ['NV', 'AZ']);
			s.placeTroop(1, ['TX']);
			s.confirmPlacement();
			return { first: s.game!.current, fleet: JSON.stringify(s.game!.boards[1].troops) };
		};
		expect(play(1)).toEqual(play(5));
	});

	it('draws a new seed per game unless ?seed fixed it, and replay uses seed + 1', () => {
		const free = new Session();
		free.reseed(5);
		free.chooseCamp('france');
		expect(free.seed).not.toBe(5);
		const fixed = seeded();
		fixed.chooseCamp('france');
		expect(fixed.seed).toBe(7);
		fixed.home();
		fixed.chooseCamp('france');
		expect(fixed.seed).toBe(7);
		fixed.replay();
		expect(fixed.seed).toBe(8);
	});

	it('logs fogged shots: troopId only on an unmasked troop', () => {
		const s = seeded('screen=end');
		const hits = s.log.filter((e) => e.shot.outcome === 'hit');
		expect(hits.length).toBeGreaterThan(0);
		for (const e of hits) expect(e.shot.troopId).toBeUndefined();
		const unmasked = s.log.filter((e) => e.shot.outcome === 'unmasked');
		expect(unmasked.length).toBeGreaterThanOrEqual(3);
		for (const e of unmasked) expect(e.shot.troopId).toBeDefined();
	});

	it('never lets the enemy map show a hidden troop', () => {
		const s = seeded('screen=battle');
		const enemyTroopCells = s.game!.boards[1].troops.flatMap((t) => t.cells);
		for (const c of enemyTroopCells) expect(['fog', 'hit', 'unmasked']).toContain(s.enemyCellsView[c]);
		expect(Object.values(enemyCells(s.enemyView!))).not.toContain('troop');
		expect(Object.values(ownCells(s.myBoard!))).toContain('troop');
	});

	it('?screen=end lands on a finished game', () => {
		const s = seeded('screen=end');
		expect(s.screen).toBe('end');
		expect(s.game?.phase).toBe('over');
	});
});
