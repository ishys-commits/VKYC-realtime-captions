# Toss-to-delete

A playful delete confirmation: instead of a "Delete" button, the user
**tosses the file into a bin** — flick it up or drop it straight in.
Miss it and it bounces back with a running miss counter; after a few
misses a plain Delete / Cancel button appears so nobody gets stuck.

Built with **React + Framer Motion**.

## Run the demo

```bash
npm install
npm run dev      # open the printed localhost URL
```

The demo (`src/App.tsx`) has a live control panel for every setting.

## Use the component

```tsx
import DeleteFileCard from "./DeleteFileCard";

<DeleteFileCard
  config={{ fileName: "invoice.pdf", speed: 1.2, missLimit: 3 }}
  onDelete={() => actuallyDeleteFile()}
  onCancel={() => close()}
  onMiss={(n) => console.log("missed", n)}
/>;
```

Everything is driven by a `config` object; anything you omit falls back to
`defaultConfig` in `src/DeleteFileCard.tsx`.

### Settings

| Setting | What it does |
|---|---|
| `speed` | Global speed multiplier (1 = default, 2 = 2×, 0.5 = slow-mo). |
| `hitTolerance` | Extra px around the bin mouth — how forgiving the target is. |
| `throwProjection` | How far the release velocity is projected to decide where it lands. |
| `throwThreshold` | Min fling speed (px/s) that counts as a real throw vs. a nudge. |
| `flickThreshold` | Upward speed that always reads as an intentional "flick & toss". |
| `spring` | `{ stiffness, damping }` for the bounce-back on a miss. |
| `ballSize`, `ballOffset`, `binOffset`, `binSize` | Position & size of the ball and bin. |
| `missLimit` | After this many misses, reveal the fallback buttons. |
| `fallback` | `"after-limit"` \| `"always"` \| `"never"`. |
| `title`, `fileName`, `description`, `hint`, `missHint`, `deletedTitle`, `deletedDescription` | Copy. `{file}` and `{n}` are interpolated. |

### Callbacks

- `onDelete()` — the ball landed in the bin (or Delete pressed). Do the real deletion here.
- `onCancel()` — user backed out via the fallback Cancel button.
- `onMiss(missCount)` — a throw missed; receives the running total.

## Interaction & edge cases

| Case | Behaviour |
|---|---|
| Lands in bin (drop / throw / upward flick) | Arc in → bin "gulp" → `onDelete`. |
| Weak or aimless release | Springs back, **miss +1**. |
| Tiny nudge near the start | Snaps back, **not** counted as a miss. |
| `missLimit` reached | Fallback **Delete / Cancel** buttons fade in. |
| `prefers-reduced-motion` / keyboard | Drag disabled, buttons shown immediately; ball is focusable — **Enter** or **↑** throws. |
