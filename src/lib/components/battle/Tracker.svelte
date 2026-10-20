<script lang="ts">
	import { fr } from '$lib/content/fr';
	import { FLEET } from '$lib/game/types';
	import { fmt } from './format';

	interface Props {
		title: string;
		/** Sizes of the troops that are not unmasked yet. */
		remaining: readonly number[];
		variant: 'enemy' | 'yours';
	}
	let { title, remaining, variant }: Props = $props();
	// Remaining sizes are unique (one troop of each size).
	const left = $derived(FLEET.filter((s) => remaining.includes(s)).length);
</script>

<section class="tracker {variant} rounded-lg border border-white/15 bg-white/5 p-3" aria-label={title}>
	<h3 class="type-label label-muted flex items-baseline justify-between">
		<span>{title}</span>
		<span class="tracker-count text-base font-semibold">{left}/{FLEET.length}</span>
	</h3>
	<ul class="mt-2 flex gap-4">
		{#each FLEET as size (size)}
			{@const alive = remaining.includes(size)}
			<li class="troop flex items-center gap-1" class:alive class:down={!alive}>
				<span class="pips flex gap-0.5" aria-hidden="true">
					{#each { length: size } as _, i (i)}
						<span
							class="pip block size-3.5 rounded-xs border {alive
								? 'border-(--paper) bg-(--paper)/25'
								: 'border-(--red) bg-(--red)'}"
						></span>
					{/each}
				</span>
				<span class="sr-only">
					{fmt(fr.battle.troops.size, { n: size })} : {alive ? fr.battle.troops.hidden : fr.battle.troops.unmasked}
				</span>
			</li>
		{/each}
	</ul>
</section>
