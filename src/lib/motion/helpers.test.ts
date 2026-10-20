import { describe, expect, it } from 'vitest';
import { countValue, duration, impactPlan, sideOf, stateSelector, REDUCED_MAX_S } from './helpers';

describe('motion helpers', () => {
	it('builds state selectors and rejects junk', () => {
		expect(stateSelector('TX')).toBe('path.state[data-id="TX"]');
		expect(() => stateSelector('"]x')).toThrow();
	});
	it('caps durations under reduced motion', () => {
		expect(duration(0.6, false)).toBe(0.6);
		expect(duration(0.6, true)).toBe(REDUCED_MAX_S);
		expect(duration(0.05, true)).toBe(0.05);
	});
	it('picks the map side', () => {
		expect(sideOf(0, 'ai')).toBe('enemy');
		expect(sideOf(1, 'ai')).toBe('mine');
	});
	it('plans impacts', () => {
		expect(impactPlan('miss', false, false)).toMatchObject({ kind: 'miss', ripple: false, shake: false });
		expect(impactPlan('miss', true, false)).toMatchObject({ kind: 'near', ripple: true });
		expect(impactPlan('hit', false, false)).toMatchObject({ ripple: true, shake: false });
		expect(impactPlan('unmasked', false, false).shake).toBe(true);
		expect(impactPlan('unmasked', false, true)).toEqual({ kind: 'unmasked', pulse: false, ripple: false, shake: false });
	});
	it('counts up', () => {
		expect(countValue(10, 0.5)).toBe(5);
		expect(countValue(10, 2)).toBe(10);
		expect(countValue(0.456, 1, 2)).toBe(0.46);
	});
});
