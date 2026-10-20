import type { Neighbors, StateId } from '$lib/game/types';

/** A new state may join when the selection is empty or it borders one already in it. */
export function canExtend(selection: readonly StateId[], id: StateId, neighbors: Neighbors): boolean {
	if (selection.length === 0) return true;
	const around = neighbors[id] ?? [];
	return selection.some((s) => around.includes(s));
}

/** The part of `selection` still connected to its first state (order kept). */
export function keepConnected(selection: readonly StateId[], neighbors: Neighbors): StateId[] {
	if (selection.length === 0) return [];
	const set = new Set(selection);
	const seen = new Set<StateId>([selection[0]]);
	const queue = [selection[0]];
	while (queue.length) {
		const id = queue.pop()!;
		for (const n of neighbors[id] ?? []) {
			if (set.has(n) && !seen.has(n)) {
				seen.add(n);
				queue.push(n);
			}
		}
	}
	return selection.filter((s) => seen.has(s));
}

/** Replaces `{key}` placeholders in a copy string. */
export function fill(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
