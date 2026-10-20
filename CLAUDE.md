# States Battle

SvelteKit 5 game, prerendered with `adapter-static`, deployed on Vercel from `main` (`vercel.json`: static `build/` output). It was a Nuxt 3 prototype from a 2023 Gobelins D3 workshop with Aurore Vigneron, rewritten in 2026.

Battleship on the 48 contiguous states: France and Great Britain each hide three troops on the American map, and the first to unmask the enemy's wins. All copy is French, in `src/lib/content/fr.ts`; never hard-code strings in components.

## Architecture
- `src/lib/game/types.ts`: the rules (JSDoc) and every contract. Change the rules here first.
- `engine.ts`: pure, immutable rules. `fogOf` is the only view of the enemy board that the AI and the UI get. Hidden troops must never reach the DOM; `troopId` is dropped from `hit` shots so the size of a troop isn't revealed.
- `ai.ts`: easy (random), normal (hunt/target plus `near` hints) and hard (sampled placement density).
- `session.svelte.ts`: UI state, AI turns, local pass-the-device play. It is the only API the screens use.
- `src/lib/map/`: simplified TopoJSON (36 KB, pre-projected: draw with `geoPath()` and no projection), French names, and border adjacency without Four Corners point contacts. Rebuild with `scripts/build-map.mjs`.
- `src/lib/motion/`: GSAP layer. It finds elements by class name and `data-id`, so never rename those in components.
- Tests sit beside the code (`*.test.ts`). `simulation.test.ts` plays 1 000 AI-vs-AI games through the real engine.

## Commands
`pnpm dev` (port 5191), `pnpm test`, `pnpm check`, `pnpm build`. pnpm 11 (`packageManager`).

QA flags: `?seed=<n>`, `?screen=home|camp|placement|battle|end`, `?mode=ai|local`, `?level=easy|normal|hard`. `/dev/map` shows the map component alone.

## Conventions
Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`), `onclick=` syntax, Tailwind v4 tokens in `src/app.css` (shared `.btn`, `.type-*` classes). Respect `prefers-reduced-motion`. Keyboard and screen-reader play must keep working.
