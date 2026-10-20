<script lang="ts">
	import { fr } from '$lib/content/fr';
	import type { LogEntry } from '$lib/game/session.svelte';
	import { fmt, outcomeText, stateName } from './format';

	interface Props {
		entries: readonly LogEntry[];
		/** Who fired, in words. */
		who: (entry: LogEntry) => string;
	}
	let { entries, who }: Props = $props();
	const newestFirst = $derived([...entries].reverse());
</script>

<section class="shot-log flex min-h-0 flex-col rounded-lg border border-white/15 bg-white/5 p-3" aria-labelledby="shot-log-title">
	<h3 id="shot-log-title" class="type-label label-muted">{fr.battle.log}</h3>
	{#if newestFirst.length === 0}
		<p class="mt-2 text-sm label-muted">{fr.battle.noShots}</p>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<ol class="log-list mt-2 max-h-48 overflow-y-auto pr-1 lg:max-h-72" tabindex="0" aria-label={fr.battle.log}>
			{#each newestFirst as entry (entry.shot.turn)}
				<li
					class="log-entry flex flex-wrap items-baseline gap-x-2 border-b border-white/10 py-1 text-sm last:border-0 {entry
						.shot.outcome}"
				>
					<span class="w-14 shrink-0 label-muted">{fmt(fr.battle.turnN, { n: entry.shot.turn })}</span>
					<span class="font-semibold">{who(entry)}</span>
					<span class="sr-only">{stateName(entry.shot.target)} :</span>
					<span>{outcomeText(entry.shot)}</span>
				</li>
			{/each}
		</ol>
	{/if}
</section>
