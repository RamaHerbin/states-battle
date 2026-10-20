<script lang="ts">
	import { tick } from 'svelte';
	import UsMap from '$lib/components/map/UsMap.svelte';
	import { fr } from '$lib/content/fr';
	import { session } from '$lib/game/session.svelte';
	import { FEATURES, NATION, STATES, VIEWBOX } from '$lib/map/data';
	import PassDevice from '$lib/components/placement/PassDevice.svelte';
	import ShotLog from './ShotLog.svelte';
	import Tracker from './Tracker.svelte';
	import TurnBanner from './TurnBanner.svelte';
	import { campName, campOf, fmt, outcomeText } from './format';

	let enemyMap = $state<{ focusMap?: () => void }>();
	let handoffButton = $state<HTMLButtonElement>();

	// Keyboard focus follows the turn: back on the enemy map when it is the viewer's turn
	// again, but only if focus was inside this screen or lost on <body>.
	let couldFire = session.canFire;
	$effect(() => {
		const can = session.canFire;
		if (can && !couldFire) {
			tick().then(() => {
				const a = document.activeElement;
				if (!a || a === document.body) enemyMap?.focusMap?.();
			});
		}
		couldFire = can;
	});

	// Result step (local mode): the button is the next stop for keyboard users.
	$effect(() => {
		if (session.handoff) handoffButton?.focus();
	});

	type Tab = 'enemy' | 'mine';
	let tab = $state<Tab>('enemy');

	// Small screens show one map: follow the action while the computer fires.
	$effect(() => {
		tab = session.aiThinking ? 'mine' : 'enemy';
	});

	const myTroops = $derived(session.myBoard?.troops ?? []);
	const myRemaining = $derived.by(() => {
		const hit = new Set(session.myBoard?.shotsReceived.map((s) => s.target));
		return myTroops.filter((t) => !t.cells.every((c) => hit.has(c))).map((t) => t.size);
	});

	const announcement = $derived.by(() => {
		const last = session.lastShot;
		if (!last) return '';
		const who =
			session.mode === 'ai'
				? last.by === 0
					? fr.battle.shotBy.you
					: fr.battle.shotBy.enemy
				: campName(campOf(last.by, session.camp));
		return `${who} : ${outcomeText(last.shot)}`;
	});

	const who = (e: { by: 0 | 1 }) =>
		session.mode === 'ai'
			? e.by === 0
				? fr.battle.shotBy.you
				: fr.battle.shotBy.enemy
			: campName(campOf(e.by, session.camp));

	const alreadyShot = (id: string) => session.enemyCellsView[id] !== 'fog';
</script>

<section class="battle screen flex min-h-dvh flex-col gap-3">
	<h1 class="screen-heading sr-only" tabindex="-1">{fr.battle.title}</h1>
	<p class="outcome-live sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>

	{#if session.passDevice}
		<PassDevice
			title={fmt(session.log.length === 0 ? fr.battle.startTitle : fr.battle.passDeviceTitle, {
				camp: campName(session.viewerCamp)
			})}
			text={session.log.length === 0 ? undefined : fr.battle.passDevice}
			camp={session.viewerCamp}
			cta={fr.battle.passDeviceCta}
			onconfirm={() => session.ackPassDevice()}
		/>
	{:else}
		<TurnBanner />

		{#if announcement}
			<p class="last-outcome rounded-md bg-white/10 px-3 py-1.5 text-base" aria-hidden="true">{announcement}</p>
		{/if}

		{#if session.handoff}
			<button type="button" class="handoff btn btn--primary btn--lg" bind:this={handoffButton} onclick={() => session.finishTurn()}>
				{fr.battle.handoffCta}
			</button>
		{/if}

		<div class="tabs flex gap-2 lg:hidden" role="group" aria-label={fr.battle.tabs}>
			{#each [['enemy', fr.battle.enemyMap], ['mine', fr.battle.yourMap]] as const as [id, label] (id)}
				<button
					type="button"
					id="tab-{id}"
					aria-pressed={tab === id}
					class="tab min-h-11 flex-1 rounded-md border px-3 text-lg font-semibold {tab ===
					id
						? 'border-(--paper) bg-(--paper) text-(--navy)'
						: 'border-white/25 bg-white/5'}"
					onclick={() => (tab = id)}
				>
					{label}
				</button>
			{/each}
		</div>

		<div class="battle-grid grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
			<div
				id="pane-enemy"
				class="pane enemy-pane min-w-0 max-w-full {tab === 'enemy' ? '' : 'max-lg:hidden'}"
			>
				<h2 class="type-panel mb-1 hidden lg:block">{fr.battle.enemyMap}</h2>
				<div class="map-wrap enemy-map min-w-0 max-w-full">
					<UsMap
						bind:this={enemyMap}
						features={FEATURES}
						nation={NATION}
						viewBox={VIEWBOX}
						names={STATES}
						cells={session.enemyCellsView}
						interactive={session.canFire}
						disabled={alreadyShot}
						label={fr.battle.enemyMap}
						onselect={(id) => session.fireAt(id)}
					/>
				</div>
			</div>

			<div class="side flex min-w-0 flex-col gap-3">
				<div
					id="pane-mine"
					class="pane mine-pane min-w-0 max-w-full {tab === 'mine' ? '' : 'max-lg:hidden'}"
				>
					<h2 class="type-panel mb-1 hidden lg:block">{fr.battle.yourMap}</h2>
					<div class="map-wrap my-map mx-auto min-w-0 max-w-full">
						<UsMap
							features={FEATURES}
							nation={NATION}
							viewBox={VIEWBOX}
							names={STATES}
							cells={session.myCells}
							label={fr.battle.yourMap}
						/>
					</div>
				</div>

				<div class="trackers grid grid-cols-2 gap-3">
					<Tracker variant="enemy" title={fr.battle.troops.enemy} remaining={session.enemyView?.remaining ?? []} />
					<Tracker variant="yours" title={fr.battle.troops.yours} remaining={myRemaining} />
				</div>

				<ShotLog entries={session.log} {who} />
			</div>
		</div>
	{/if}
</section>
