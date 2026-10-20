<script lang="ts">
	import UsMap from '$lib/components/map/UsMap.svelte';
	import { campName, fmt } from '$lib/components/battle/format';
	import { fr } from '$lib/content/fr';
	import { ownCells, session } from '$lib/game/session.svelte';
	import type { PlayerId } from '$lib/game/types';
	import { FEATURES, NATION, STATES, VIEWBOX } from '$lib/map/data';

	const game = $derived(session.game);
	const players: readonly PlayerId[] = [0, 1];

	const title = $derived(
		session.mode === 'local'
			? fmt(fr.end.winCamp, { camp: game ? campName(game.camps[session.winner ?? 0]) : '' })
			: session.winner === 0
				? fr.end.win
				: fr.end.lose
	);
	const won = $derived(session.mode === 'local' || session.winner === 0);

	const nameOf = (p: PlayerId) =>
		session.mode === 'local' ? campName(game!.camps[p]) : p === 0 ? fr.battle.shotBy.you : fr.battle.shotBy.enemy;
	const percent = (x: number) => `${Math.round(x * 100)} %`;
</script>

{#if game}
	<section class="end screen flex min-h-dvh flex-col gap-5">
		<header class="end-header text-center">
			<h1
				class="end-title type-screen {won
					? ''
					: 'text-(--red)'}"
				data-result={won ? 'win' : 'lose'}
			>
				{title}
			</h1>
		</header>

		<section class="end-stats" aria-labelledby="end-stats-title">
			<h2 id="end-stats-title" class="sr-only">{fr.end.stats}</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each players as p (p)}
					{@const st = session.stats(p)}
					<article
						class="player-stats rounded-lg border p-4 {p === session.winner
							? 'border-(--paper)/70 bg-white/10'
							: 'border-white/15 bg-white/5'}"
					>
						<h3 class="type-panel">{nameOf(p)}</h3>
						<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
							<dt class="label-muted">{fr.end.statShots}</dt>
							<dd class="stat-shots text-right font-semibold">{st.shots}</dd>
							<dt class="label-muted">{fr.end.statHits}</dt>
							<dd class="stat-hits text-right font-semibold">{st.hits}</dd>
							<dt class="label-muted">{fr.end.statAccuracy}</dt>
							<dd class="stat-accuracy text-right font-semibold">{percent(st.accuracy)}</dd>
							<dt class="label-muted">{fr.end.statUnmasked}</dt>
							<dd class="stat-unmasked text-right font-semibold">{st.unmasked}/3</dd>
						</dl>
					</article>
				{/each}
			</div>
		</section>

		<section class="end-maps" aria-labelledby="end-maps-title">
			<h2 id="end-maps-title" class="sr-only">{fr.end.maps}</h2>
			<div class="grid min-w-0 gap-4 md:grid-cols-2">
				{#each players as p (p)}
					<figure class="end-map min-w-0 max-w-full">
						<figcaption class="type-panel mb-1">{campName(game.camps[p])}</figcaption>
						<div class="map-wrap min-w-0 max-w-full">
							<UsMap
								features={FEATURES}
								nation={NATION}
								viewBox={VIEWBOX}
								names={STATES}
								cells={ownCells(game.boards[p])}
								label={`${fr.end.maps} : ${campName(game.camps[p])}`}
							/>
						</div>
					</figure>
				{/each}
			</div>
		</section>

		<div class="end-actions flex flex-wrap justify-center gap-3 pb-4">
			<button
				type="button"
				class="btn-replay btn btn--primary btn--lg"
				onclick={() => session.replay()}
			>
				{fr.end.replay}
			</button>
			<button
				type="button"
				class="btn-home btn btn--lg"
				onclick={() => session.home()}
			>
				{fr.end.home}
			</button>
		</div>
	</section>
{/if}
