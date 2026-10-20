# States Battle

Battleship on the American states. In the 18th century, France and Great Britain fight over the territories to conquer: each camp hides three troops on its map, and the first to unmask all of the enemy's wins.

**Play:** [states-battle.vercel.app](https://states-battle.vercel.app)

Made with [Aurore Vigneron](https://www.instagram.com/dawn_illu) (design, [Figma](https://www.figma.com/file/kipM6PJKbK3WdtWUDA5PZl/State-Battle-Game?type=design&node-id=3%3A3&mode=dev)), first as a one-day D3.js workshop at [Gobelins Paris](https://www.gobelins.fr/) in 2023, then finished in 2026.

## Rules

- Each camp hides three troops: one of 1 state, one of 2 and one of 3. A troop is a single block of neighbouring states (a shared border, not a corner), and troops never overlap.
- Players take turns firing at one state of the enemy map.
  - **Miss**: no troop there.
  - **Troop nearby**: a miss that borders an enemy troop not hit yet.
  - **Hit**: one state of a troop.
  - **Unmasked**: the troop's last state; the whole troop is revealed.
- The first to unmask all three enemy troops wins.
- Play against the computer (easy, normal, hard) or two players on one screen, passing the device between turns.

## Stack

SvelteKit (Svelte 5) prerendered with `adapter-static`, Tailwind CSS v4, d3-geo and topojson for the map (48 contiguous states, pre-projected Albers USA), GSAP for motion, Vitest.

```bash
pnpm install
pnpm dev      # http://localhost:5191
pnpm test     # engine, AI, 1 000 AI-vs-AI games, map data
pnpm check
pnpm build    # static site in build/
```

QA flags: `?seed=<n>`, `?screen=home|camp|placement|battle|end`, `?mode=ai|local`, `?level=easy|normal|hard`. `/dev/map` shows the map component alone.

## Layout

```
src/lib/game/types.ts         rules (JSDoc) and contracts
src/lib/game/engine.ts        pure rules: placement, fire, fog
src/lib/game/ai.ts            the computer (hunt/target, sampled density)
src/lib/game/session.svelte.ts  UI state, the only API the screens use
src/lib/map/                  simplified TopoJSON, French names, neighbours
src/lib/components/           map, screens
src/lib/motion/               GSAP layer, driven by the session
scripts/build-map.mjs         rebuilds the map data from the source TopoJSON
```

## Licence

[MIT](LICENSE)
