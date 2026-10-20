<!-- Renderless: watches the session and plays the motion layer after DOM updates. -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { session } from '$lib/game/session.svelte';
	import { REDUCED_QUERY, sideOf } from './helpers';
	import { enterScreen, passCover, shotImpact, troopUnmasked, turnChange, type Kill } from './motion';

	let reduced = $state(false);
	let kills: Kill[] = [];

	onMount(() => {
		const mq = window.matchMedia(REDUCED_QUERY);
		reduced = mq.matches;
		const on = (e: MediaQueryListEvent) => (reduced = e.matches);
		mq.addEventListener('change', on);
		return () => {
			mq.removeEventListener('change', on);
			clearAll();
		};
	});

	const clearAll = () => {
		for (const k of kills) k();
		kills = [];
	};
	const run = (k: Kill) => kills.push(k);
	const root = () => document.body;

	let lastScreen: string | null = null;
	let lastLog = 0;
	let lastPass = false;
	let lastViewer: number | null = null;

	// Screen entrance
	$effect(() => {
		const screen = session.screen;
		if (screen === lastScreen) return;
		lastScreen = screen;
		lastLog = session.log.length;
		const r = reduced;
		clearAll();
		tick().then(() => {
			if (session.screen === screen && !session.passDevice) run(enterScreen(screen, root(), r));
		});
	});

	// Shots
	$effect(() => {
		const n = session.log.length;
		const shot = session.lastShot;
		if (n === lastLog) return;
		const fresh = n > lastLog;
		lastLog = n;
		if (!fresh || !shot || session.screen !== 'battle') return;
		const r = reduced;
		const side = sideOf(shot.by, session.mode);
		tick().then(() => {
			run(shotImpact(root(), shot.shot, side, r));
			if (shot.shot.outcome === 'unmasked') {
				const troop = session.game?.boards[shot.by === 0 ? 1 : 0].troops.find((t) => t.id === shot.shot.troopId);
				if (troop) run(troopUnmasked(root(), troop.cells, side, r));
			}
		});
	});

	// Turn banner swap
	$effect(() => {
		const viewer = session.viewer;
		const thinking = session.aiThinking;
		void thinking;
		if (viewer === lastViewer) return;
		const first = lastViewer === null;
		lastViewer = viewer;
		if (first || session.screen !== 'battle') return;
		const r = reduced;
		tick().then(() => run(turnChange(root(), r)));
	});

	// AI thinking toggles the banner text too
	$effect(() => {
		if (!session.aiThinking || session.screen !== 'battle') return;
		const r = reduced;
		tick().then(() => run(turnChange(root(), r)));
	});

	// Pass-device cover
	$effect(() => {
		const pass = session.passDevice;
		if (pass === lastPass) return;
		lastPass = pass;
		if (!pass) return;
		const r = reduced;
		tick().then(() => run(passCover(root(), r)));
	});
</script>
