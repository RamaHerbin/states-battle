// One-shot build of the map data. Run from apps/states-battle:
//
//   (cd <dir> && npm i topojson-server topojson-simplify)   # not project deps
//   TOPO_TOOLS=<dir> node scripts/build-map.mjs <path/to/us-trimed.json>
//
// The source is pre-projected (Albers USA, ~975x610 plane). Output:
//   src/lib/map/states.topo.json  48 states, DC dropped, simplified, quantized
//   src/lib/map/neighbors.json    shared-border adjacency (no point contacts)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { feature, neighbors as topoNeighbors } from 'topojson-client';

const [src] = process.argv.slice(2);
const toolsDir = process.env.TOPO_TOOLS;
if (!src || !toolsDir) {
	console.error('usage: TOPO_TOOLS=<dir with topojson-server/simplify> node build-map.mjs <us-trimed.json>');
	process.exit(1);
}
const require = createRequire(toolsDir.replace(/\/?$/, '/') + 'x.js');
const { topology } = require('topojson-server');
const { presimplify, simplify, quantile } = require('topojson-simplify');
const { quantize } = require('topojson-client');

const MIN_WEIGHT_QUANTILE = 0.5; // drop the 50% least significant points
const QUANTIZATION = 1e4;
const out = (name) => new URL(`../src/lib/map/${name}`, import.meta.url);

const full = JSON.parse(readFileSync(src, 'utf8'));
const fc = feature(full, full.objects.states);
fc.features = fc.features.filter((f) => f.id !== 'DC');

const bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
const visit = (c) => {
	if (typeof c[0] === 'number') {
		bounds.x0 = Math.min(bounds.x0, c[0]);
		bounds.x1 = Math.max(bounds.x1, c[0]);
		bounds.y0 = Math.min(bounds.y0, c[1]);
		bounds.y1 = Math.max(bounds.y1, c[1]);
	} else c.forEach(visit);
};
fc.features.forEach((f) => visit(f.geometry.coordinates));
console.log('bounds', bounds);

// Re-topologize so shared borders are single arcs, then simplify arcs once.
let topo = topology({ states: fc }, 1e6);
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, 1 - MIN_WEIGHT_QUANTILE));
topo = quantize(topo, QUANTIZATION);
// Plain `properties: {name}` and string ids only.
const json = JSON.stringify(topo);
writeFileSync(out('states.topo.json'), json);
console.log('topo KB', (json.length / 1024).toFixed(1));

// Adjacency on the final geometry: arcs shared by two states = shared border.
// Point contacts (Four Corners) share no arc, so topojson.neighbors skips them.
// A state can share an arc with itself (multi-part geometry): ignore it.
const geoms = topo.objects.states.geometries;
const ids = geoms.map((g) => g.id);
const adj = Object.fromEntries(ids.map((id) => [id, new Set()]));
topoNeighbors(geoms).forEach((list, i) => list.forEach((j) => j !== i && adj[ids[i]].add(ids[j])));
const result = Object.fromEntries(
	Object.keys(adj)
		.sort()
		.map((id) => [id, [...adj[id]].sort()])
);
writeFileSync(out('neighbors.json'), JSON.stringify(result, null, '\t') + '\n');
console.log('states', ids.length, 'AZ', result.AZ.join(','), 'UT', result.UT.join(','));
