import { describe, expect, it } from 'vitest';
import { STATE_IDS } from '$lib/map/data';
import { Session, enemyCells, ownCells } from './session.svelte';

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

	it('local mode hides the maps between turns and switches viewer', () => {
		const s = seeded('mode=local&screen=battle');
		expect(s.screen).toBe('battle');
		expect(s.passDevice).toBe(false);
		const shooter = s.viewer;
		const target = STATE_IDS.find((id) => s.enemyCellsView[id] === 'fog')!;
		s.fireAt(target);
		expect(s.passDevice).toBe(true);
		expect(s.canFire).toBe(false);
		s.ackPassDevice();
		expect(s.viewer).not.toBe(shooter);
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
