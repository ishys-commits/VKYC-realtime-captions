# VKYC — Language Selection Screen (redesign)

A self-contained, dependency-free prototype of the reworked language-selection
screen. Open `index.html` in any browser (or on a phone) — no build step.

> **Note on the repo.** This repository contained no application code when the
> redesign started (only unrelated payment-logo PNGs). The reference
> "Choose your language" screenshot was therefore the source of truth for the
> **visual design system**, and this file is the first implementation of the
> screen. Nothing existing was overwritten.

## What this redesign changes

The rework is an **information-architecture** change, not a visual-system
change. Typography, the indigo primary, green "available" / amber "fallback"
treatments, border radii, card proportions, spacing, the CTA and the
`powered by HyperVerge` footer are all kept faithful to the reference screen.

The moodboard was used **only** as inspiration for how to group dense
information — its colours, typography and branding were not copied.

### The key correctness fix

A language with no matching agent but a captions path does **not** mean the
agent is unavailable — an agent *is* available in another language. So the
captions state never says "Agent unavailable". It says, in plain language:

> **Talk in English, read Bengali captions**
> No Bengali-speaking agent right now

and requires an explicit opt-in via a confirmation sheet.

## Card states (per the PRD)

| State | Meaning | Treatment |
|-------|---------|-----------|
| **A — Available** | Matching-language agent exists | White card, green `Available` badge, `You're #3 in queue · ~2 min` |
| **B — Unavailable, no captions** | No agent, no captions path | Quiet sunken card, grey `Unavailable`, optional `Available tomorrow at 9:00 AM`. Not selectable — **not** styled as an error |
| **C — Unavailable, captions available** | No matching agent, but you can talk to another-language agent and read captions | Amber-accented card (valid, not dead) + explicit `Continue with … captions` opt-in |
| **D — Selected** | Chosen language | Indigo border + tint. Captions-confirmed selections additionally show a `Captions on` badge so they never look like a normal available language |

Other details:
- **"Near you"** appears as a small inline badge beside the language name — it
  never consumes a line.
- Queue is phrased as **"You're #3 in queue"** (natural position), not
  "2 in queue" or "Token 3".
- **"Agents online" is deliberately not shown** — queue position and estimated
  wait are the actionable numbers.
- The bottom CTA reflects the selection: **"Continue in Hindi"** /
  **"Continue with Bengali captions"**.
- The captions confirmation sheet is rendered primarily in the selected
  language, with English as a secondary safety rendering, and states the three
  required facts (no matching agent now · agent speaks English · captions appear
  in the selected language).

## The three layout variations (design exploration)

A lightweight switcher at the top toggles three arrangements of the *same*
data (see PRD §10). They are kept together intentionally as a temporary
exploration rather than deleted.

- **A — Status-first.** Status badge is prominent; queue/wait is one compact
  line. Best for scanning *which* languages are available.
- **B — Decision-first (default / recommended).** Each card leads with *what
  happens if you choose it* ("Speak in Hindi with a live agent" /
  "Talk in English, read Bengali captions"). Best serves the core product goal
  of understanding the consequence of a choice.
- **C — Compact.** Tightest vertical rhythm — a single metadata row, CTA only
  where needed. Best when many languages must fit.
- **D — Grid.** A 2-up tile grid modeled on the reference grid layout
  (Freeform / Google Arts & Culture). Best for scanning many languages at a
  glance; captions still open the confirmation sheet and the dynamic CTA is
  unchanged. A secondary **Grid style** switcher (visible only in grid mode)
  offers four tile treatments — all on the same design system:
  - **Strip** — content body (status badge + Freeform-style selection check +
    language name) over a tinted footer strip carrying the status/meta
    (neutral / amber for captions / indigo when selected).
  - **Stacked** — Google-Arts style: a colored status eyebrow, language name,
    native script, then the meta line. No footer band.
  - **Centered** — spacious centered tiles: name, native, a status pill, meta,
    with the selection check in the corner.
  - **Accent** — compact tiles with a colored left status bar (green / amber /
    grey / indigo-when-selected), status eyebrow, name and meta.

**Recommendation: Variation B.** The screen's job is to let the user
understand the *consequence* of each choice (speak now / wait / read captions /
come back later), and B communicates that most directly while staying within
the reference design system and keeping card heights consistent. The switcher
defaults to B.

## Structure of `index.html`

- **Design tokens** — top of the `<style>` block; the single source of colour,
  radius, spacing and type values, derived from the reference screen.
- **Data model** — `LANGS` array; each entry declares its `status` and the
  fields that status needs (`queue`/`wait`, `agentLang` + `confirm`, `nextAt`).
- **Renderers** — one `renderCard` function with a branch per variation, so the
  three layouts share all state and selection logic.
- **Selection + confirmation** — `selectLanguage`, `openSheet`,
  `confirmCaptions`, and the dynamic CTA in `updateCTA`.
