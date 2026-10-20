import { describe, expect, it } from 'vitest';
import { FEATURES, NATION, NEIGHBORS, STATES, STATE_IDS, VIEWBOX } from './data';

const has = (a: string, b: string) => NEIGHBORS[a].includes(b);

describe('map data', () => {
	it('has the 48 contiguous states and no DC', () => {
		expect(STATES).toHaveLength(48);
		expect(new Set(STATE_IDS).size).toBe(48);
		expect(STATE_IDS).not.toContain('DC');
		expect([...STATE_IDS].sort()).toEqual([...STATE_IDS]);
		expect(Object.keys(NEIGHBORS).sort()).toEqual([...STATE_IDS]);
	});

	it('names every state in French and English', () => {
		for (const s of STATES) {
			expect(s.nameFr.length).toBeGreaterThan(2);
			expect(s.nameEn.length).toBeGreaterThan(2);
		}
		const fr = Object.fromEntries(STATES.map((s) => [s.id, s.nameFr]));
		expect(fr.GA).toBe('Géorgie');
		expect(fr.NC).toBe('Caroline du Nord');
		expect(fr.NM).toBe('Nouveau-Mexique');
	});

	it('has symmetric adjacency with no isolated state', () => {
		for (const [id, list] of Object.entries(NEIGHBORS)) {
			expect(list.length).toBeGreaterThan(0);
			expect(list).not.toContain(id);
			expect([...list].sort()).toEqual([...list]);
			for (const n of list) expect(NEIGHBORS[n]).toContain(id);
		}
	});

	it('knows real borders and ignores point contacts', () => {
		for (const [a, b] of [['CA', 'OR'], ['CA', 'NV'], ['CA', 'AZ'], ['NY', 'VT'], ['TX', 'NM']]) {
			expect(has(a, b)).toBe(true);
		}
		expect(NEIGHBORS.ME).toEqual(['NH']);
		expect(has('AZ', 'CO')).toBe(false);
		expect(has('UT', 'NM')).toBe(false);
	});

	it('exposes features matching the ids, and a nation outline', () => {
		expect(FEATURES.features.map((f) => f.id)).toEqual([...STATE_IDS]);
		for (const f of FEATURES.features) expect(f.properties.name).toBeTruthy();
		expect(NATION.coordinates.length).toBeGreaterThan(0);
		expect(VIEWBOX).toBe('0 0 975 610');
	});
});
