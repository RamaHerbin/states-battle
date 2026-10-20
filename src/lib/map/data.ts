import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Neighbors, StateId, StateInfo } from '../game/types';
import topology from './states.topo.json';
import neighborsJson from './neighbors.json';

const NAMES: readonly [StateId, string, string][] = [
	['AL', 'Alabama', 'Alabama'],
	['AR', 'Arkansas', 'Arkansas'],
	['AZ', 'Arizona', 'Arizona'],
	['CA', 'Californie', 'California'],
	['CO', 'Colorado', 'Colorado'],
	['CT', 'Connecticut', 'Connecticut'],
	['DE', 'Delaware', 'Delaware'],
	['FL', 'Floride', 'Florida'],
	['GA', 'Géorgie', 'Georgia'],
	['IA', 'Iowa', 'Iowa'],
	['ID', 'Idaho', 'Idaho'],
	['IL', 'Illinois', 'Illinois'],
	['IN', 'Indiana', 'Indiana'],
	['KS', 'Kansas', 'Kansas'],
	['KY', 'Kentucky', 'Kentucky'],
	['LA', 'Louisiane', 'Louisiana'],
	['MA', 'Massachusetts', 'Massachusetts'],
	['MD', 'Maryland', 'Maryland'],
	['ME', 'Maine', 'Maine'],
	['MI', 'Michigan', 'Michigan'],
	['MN', 'Minnesota', 'Minnesota'],
	['MO', 'Missouri', 'Missouri'],
	['MS', 'Mississippi', 'Mississippi'],
	['MT', 'Montana', 'Montana'],
	['NC', 'Caroline du Nord', 'North Carolina'],
	['ND', 'Dakota du Nord', 'North Dakota'],
	['NE', 'Nebraska', 'Nebraska'],
	['NH', 'New Hampshire', 'New Hampshire'],
	['NJ', 'New Jersey', 'New Jersey'],
	['NM', 'Nouveau-Mexique', 'New Mexico'],
	['NV', 'Nevada', 'Nevada'],
	['NY', 'New York', 'New York'],
	['OH', 'Ohio', 'Ohio'],
	['OK', 'Oklahoma', 'Oklahoma'],
	['OR', 'Oregon', 'Oregon'],
	['PA', 'Pennsylvanie', 'Pennsylvania'],
	['RI', 'Rhode Island', 'Rhode Island'],
	['SC', 'Caroline du Sud', 'South Carolina'],
	['SD', 'Dakota du Sud', 'South Dakota'],
	['TN', 'Tennessee', 'Tennessee'],
	['TX', 'Texas', 'Texas'],
	['UT', 'Utah', 'Utah'],
	['VA', 'Virginie', 'Virginia'],
	['VT', 'Vermont', 'Vermont'],
	['WA', 'Washington', 'Washington'],
	['WI', 'Wisconsin', 'Wisconsin'],
	['WV', 'Virginie-Occidentale', 'West Virginia'],
	['WY', 'Wyoming', 'Wyoming']
];

/** The 48 contiguous states (DC is not playable), sorted by id. */
export const STATES: readonly StateInfo[] = NAMES.map(([id, nameFr, nameEn]) => ({ id, nameFr, nameEn }));

export const STATE_IDS: readonly StateId[] = STATES.map((s) => s.id);

export const NEIGHBORS: Neighbors = neighborsJson;

/**
 * Coordinates are PRE-PROJECTED (Albers USA, pixel plane): draw with
 * `geoPath()` and a null projection, inside `VIEWBOX`.
 */
export const VIEWBOX = '0 0 975 610';

const topo = topology as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;

export interface StateFeature {
	type: 'Feature';
	id: StateId;
	properties: { name: string };
	geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
}

export interface StateFeatureCollection {
	type: 'FeatureCollection';
	features: StateFeature[];
}

/** The 48 states sorted by id; `feature.id` is the `StateId`, `properties.name` the English name. */
export const FEATURES: StateFeatureCollection = (() => {
	const fc = feature(topo, topo.objects.states) as unknown as StateFeatureCollection;
	return { ...fc, features: [...fc.features].sort((a, b) => (a.id < b.id ? -1 : 1)) };
})();

/** Outer border of the country (pre-projected, same plane as `FEATURES`). */
export const NATION = mesh(topo, topo.objects.states, (a, b) => a === b) as {
	type: 'MultiLineString';
	coordinates: number[][][];
};
