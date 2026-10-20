<script lang="ts">
	import { geoPath } from 'd3-geo';
	import type { CellState, StateId, StateInfo } from '$lib/game/types';
	import type { GeoPermissibleObjects } from 'd3-geo';
	import { directionOfKey, pickNeighbor, type Point } from './geometry';
	import { rovingTarget, stateLabel } from './labels';

	/** Structural subset of GeoJSON (the app has no `geojson` types of its own). */
	interface MapFeature {
		id?: string | number;
		geometry: unknown;
	}

	interface Props {
		/** One feature per state, `feature.id` = USPS code, pre-projected (Albers USA). */
		features: { features: readonly MapFeature[] };
		viewBox?: string;
		/** Missing = 'idle'. */
		cells?: Partial<Record<StateId, CellState>>;
		/** French names, keyed by state id, or the `STATES` list. */
		names: Readonly<Record<StateId, string>> | readonly StateInfo[];
		interactive?: boolean;
		disabled?: ReadonlySet<StateId> | ((id: StateId) => boolean);
		/** Accessible name of the whole map. */
		label: string;
		nation?: object | null;
		onselect?: (id: StateId) => void;
		onhover?: (id: StateId | null) => void;
	}

	let {
		features,
		viewBox = '0 0 975 610',
		cells = {},
		names,
		interactive = false,
		disabled,
		label,
		nation = null,
		onselect,
		onhover
	}: Props = $props();

	const path = geoPath();

	const shapes = $derived(
		features.features.map((f) => ({
			id: String(f.id) as StateId,
			d: path(f as GeoPermissibleObjects) ?? '',
			centroid: path.centroid(f as GeoPermissibleObjects)
		}))
	);
	const nationD = $derived(nation ? (path(nation as GeoPermissibleObjects) ?? '') : '');
	const centroids = $derived(
		Object.fromEntries(shapes.map((s) => [s.id, { x: s.centroid[0], y: s.centroid[1] } satisfies Point]))
	);
	const nameOf = $derived.by(() => {
		const map: Record<string, string> = Array.isArray(names)
			? Object.fromEntries((names as readonly StateInfo[]).map((s) => [s.id, s.nameFr]))
			: (names as Record<string, string>);
		return (id: StateId) => map[id] ?? id;
	});
	const vb = $derived(viewBox.split(/\s+/).map(Number));

	const isDisabled = (id: StateId) =>
		typeof disabled === 'function' ? disabled(id) : (disabled?.has(id) ?? false);
	const cellOf = (id: StateId): CellState => cells[id] ?? 'idle';
	const ariaLabel = (id: StateId) => stateLabel(nameOf(id), cellOf(id));

	let hovered = $state<StateId | null>(null);
	let focused = $state<StateId | null>(null);
	/** Focus reached by keyboard: drawn as a ring above the borders (outlines don't suit SVG paths). */
	let ringId = $state<StateId | null>(null);
	let rovingId = $state<StateId | null>(null);
	/** Pointer position in % of the wrapper, while hovering with a pointer. */
	let pointer = $state<{ x: number; y: number } | null>(null);
	let svgEl = $state<SVGSVGElement>();

	const tipId = $derived(hovered ?? focused);
	const tipPos = $derived.by(() => {
		if (!tipId) return null;
		if (hovered && pointer) return pointer;
		const c = centroids[tipId];
		if (!c || vb.length < 4) return null;
		return { x: ((c.x - vb[0]) / vb[2]) * 100, y: ((c.y - vb[1]) / vb[3]) * 100 };
	});
	// Single tab stop (roving tabindex): the last focused state, else the first enabled one.
	const tabStop = $derived(
		rovingTarget(
			shapes.map((s) => s.id),
			rovingId,
			isDisabled
		)
	);

	/** Focus the current roving tab stop (e.g. after the map was re-enabled). */
	export function focusMap() {
		if (tabStop) svgEl?.querySelector<SVGElement>(`[data-id="${tabStop}"]`)?.focus();
	}

	function select(id: StateId) {
		if (interactive && !isDisabled(id)) onselect?.(id);
	}
	function setHover(id: StateId | null) {
		if (hovered === id) return;
		hovered = id;
		onhover?.(id);
	}
	function onPointerMove(e: PointerEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		pointer = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
	}
	function onKeydown(e: KeyboardEvent, id: StateId) {
		if (!interactive) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			select(id);
			return;
		}
		const dir = directionOfKey(e.key);
		if (!dir) return;
		e.preventDefault();
		const next = pickNeighbor(id, centroids, dir);
		if (next) {
			rovingId = next;
			svgEl?.querySelector<SVGElement>(`[data-id="${next}"]`)?.focus();
		}
	}
</script>

<div
	class="us-map"
	class:interactive
	role="presentation"
	onpointermove={interactive ? onPointerMove : undefined}
	onpointerleave={() => {
		pointer = null;
		setHover(null);
	}}
>
	<svg
		bind:this={svgEl}
		{viewBox}
		width="100%"
		role="group"
		aria-label={label}
		preserveAspectRatio="xMidYMid meet"
	>
		<defs>
			<pattern id="sb-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<rect width="8" height="8" fill="var(--sb-invalid-bg)" />
				<line x1="0" y1="0" x2="0" y2="8" stroke="var(--sb-invalid)" stroke-width="3" />
			</pattern>
		</defs>
		{#each shapes as s (s.id)}
			{@const cell = cellOf(s.id)}
			{@const off = isDisabled(s.id)}
			<!-- One set of paths in both modes, so focus survives `interactive` flipping. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<path
				d={s.d}
				data-id={s.id}
				class="state {cell}"
				class:off={off && interactive}
				class:hover={interactive && hovered === s.id}
				role={interactive ? 'button' : 'img'}
				tabindex={interactive && tabStop === s.id ? 0 : -1}
				aria-label={ariaLabel(s.id)}
				aria-disabled={interactive ? off || undefined : true}
				onclick={() => select(s.id)}
				onkeydown={(e) => onKeydown(e, s.id)}
				onpointerenter={() => interactive && setHover(s.id)}
				onpointerleave={() => interactive && setHover(null)}
				onfocus={(e) => {
					focused = s.id;
					rovingId = s.id;
					ringId = interactive && e.currentTarget.matches(':focus-visible') ? s.id : null;
					if (interactive) onhover?.(s.id);
				}}
				onblur={() => {
					if (focused === s.id) focused = null;
					if (ringId === s.id) ringId = null;
					if (interactive) onhover?.(null);
				}}
			/>
		{/each}
		{#if nationD}
			<path d={nationD} class="nation" aria-hidden="true" />
		{/if}
		{#each shapes as s (s.id)}
			{#if ringId === s.id}
				<path d={s.d} class="focus-ring outer" aria-hidden="true" />
				<path d={s.d} class="focus-ring inner" aria-hidden="true" />
			{/if}
		{/each}
		<!-- markers drawn above borders -->
		{#each shapes as s (s.id)}
			{@const cell = cellOf(s.id)}
			{#if cell === 'miss' || cell === 'near'}
				<g class="mark {cell}" transform="translate({s.centroid[0]} {s.centroid[1]})" aria-hidden="true">
					{#if cell === 'near'}<circle r="9" class="ring" />{/if}
					<path d="M-4 -4L4 4M4 -4L-4 4" />
				</g>
			{:else if cell === 'hit' || cell === 'unmasked'}
				<circle
					class="mark {cell}"
					cx={s.centroid[0]}
					cy={s.centroid[1]}
					r={cell === 'hit' ? 4 : 5}
					aria-hidden="true"
				/>
			{/if}
		{/each}
	</svg>

	{#if interactive && tipId && tipPos}
		<div class="tip" style="left:{tipPos.x}%;top:{tipPos.y}%" aria-hidden="true">{nameOf(tipId)}</div>
	{/if}
</div>

<style>
	.us-map {
		--sb-fill: var(--map-idle);
		--sb-stroke: var(--navy);
		--sb-invalid: var(--red);
		--sb-invalid-bg: color-mix(in srgb, var(--red) 14%, var(--paper));
		position: relative;
		width: 100%;
		/* A parent sets --map-max-h so the map never outgrows the viewport (viewBox ratio 975:610). */
		max-width: calc(var(--map-max-h, 1000vh) * 1.598);
		margin-inline: auto;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.state {
		fill: var(--sb-fill);
		stroke: var(--sb-stroke);
		stroke-width: 0.8;
		stroke-linejoin: round;
		outline: none;
		transition:
			fill 0.15s ease,
			stroke 0.15s ease;
	}
	/* Distinct by lightness as well as hue: fog is the dark mid-tone, a miss the lightest. */
	.state.fog {
		fill: var(--map-fog);
		stroke: color-mix(in srgb, var(--navy) 55%, var(--map-fog));
	}
	.state.miss {
		fill: var(--map-miss);
		stroke: color-mix(in srgb, var(--navy) 45%, var(--map-miss));
	}
	.state.near {
		fill: var(--map-near);
		stroke: #b86d00;
		stroke-width: 1.4;
	}
	.state.hit {
		fill: var(--red);
		stroke: var(--blood);
	}
	.state.unmasked {
		fill: var(--blood);
		stroke: var(--red);
		stroke-width: 2.2;
	}
	.state.troop {
		fill: var(--ink);
		stroke: var(--navy);
	}
	.state.preview {
		fill: color-mix(in srgb, var(--ink) 35%, transparent);
		stroke: var(--ink);
		stroke-dasharray: 4 2;
	}
	.state.invalid {
		fill: url(#sb-hatch);
		stroke: var(--red);
	}
	.interactive .state {
		cursor: pointer;
	}
	.interactive .state.off {
		cursor: not-allowed;
	}
	.interactive .state.hover:not(.off) {
		filter: brightness(0.93) saturate(1.15);
		stroke: var(--navy);
		stroke-width: 2;
	}
	.focus-ring {
		fill: none;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.focus-ring.outer {
		stroke: var(--navy);
		stroke-width: 6;
	}
	.focus-ring.inner {
		stroke: #fff;
		stroke-width: 2.5;
	}
	.nation {
		fill: none;
		stroke: var(--navy);
		stroke-width: 1.6;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.mark {
		pointer-events: none;
	}
	.mark.miss path,
	.mark.near path {
		stroke: var(--navy);
		stroke-width: 1.8;
		stroke-linecap: round;
		fill: none;
	}
	.mark .ring {
		fill: none;
		stroke: #8a4f00;
		stroke-width: 1.8;
		stroke-dasharray: 3 2;
	}
	.mark.hit {
		fill: var(--paper);
	}
	.mark.unmasked {
		fill: var(--paper);
		stroke: var(--red);
		stroke-width: 1.5;
	}
	.tip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 14px));
		padding: 0.15rem 0.5rem;
		border-radius: 0.25rem;
		background: var(--navy);
		color: var(--paper);
		font-size: 0.8rem;
		line-height: 1.3;
		white-space: nowrap;
		pointer-events: none;
		z-index: 2;
	}
	@media (prefers-reduced-motion: reduce) {
		.state {
			transition: none;
		}
	}
</style>
