import { STATES } from '$lib/map/data';
import { fr } from '$lib/content/fr';
import { otherCamp } from '$lib/game/session.svelte';
import type { Camp, PlayerId, Shot } from '$lib/game/types';

const NAME_OF: Record<string, string> = Object.fromEntries(STATES.map((s) => [s.id, s.nameFr]));

export const stateName = (id: string) => NAME_OF[id] ?? id;

export const fmt = (template: string, vars: Record<string, string | number>) =>
	template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

export const campName = (camp: Camp) => fr.camp[camp];

/** Camp of player `p` when player 0 plays `camp`. */
export const campOf = (p: PlayerId, camp: Camp): Camp => (p === 0 ? camp : otherCamp(camp));

/** The copy of a shot's outcome, with the French state name. */
export function outcomeText(shot: Shot): string {
	const key = shot.outcome === 'miss' && shot.near ? 'near' : shot.outcome;
	return fmt(fr.battle.outcome[key], { state: stateName(shot.target) });
}
