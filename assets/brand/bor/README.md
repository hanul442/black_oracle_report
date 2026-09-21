# BOR Brand Assets

**Brand:** BOR — Black Oracle Research  
**Version:** v1.0  
**Status:** LOCKED  
**Approved:** 2026-09-21

BOR is the research / intelligence layer of the Black Oracle ecosystem.

> Evidence → Intelligence → Decision Support

## Source of truth

The approved visual direction is the BOR logo system selected on 2026-09-21: a bold geometric wordmark with a triangular intelligence mark, deep navy / graphite materials, and restrained institutional styling.

Repository-native SVGs under `assets/brand/bor/v1/` are the implementation source of truth for product work.

## Files

- `v1/bor-symbol.svg` — primary symbol on light/transparent backgrounds
- `v1/bor-wordmark.svg` — primary wordmark + descriptor
- `v1/bor-wordmark-on-dark.svg` — dark-surface wordmark
- `v1/brand-board.svg` — compact visual reference board
- `v1/brand-tokens.json` — palette and typography tokens

## Usage

Preferred product usage:

```tsx
<img src="/assets/brand/bor/v1/bor-wordmark-on-dark.svg" alt="BOR — Black Oracle Research" />
```

Use the symbol alone for app icons, favicons, compact navigation and avatars.

## Brand rules

1. BOR = **Research / Evidence / Intelligence**.
2. Keep the palette institutional: Obsidian, Frost, Intelligence Blue, Evidence Cyan.
3. Do not introduce purple AI gradients, crypto imagery, gaming HUDs or generic robot/brain imagery.
4. Keep clearspace around the symbol equal to at least 25% of the symbol width.
5. Do not distort, rotate or redraw the v1 mark inside production UI.
6. Wordmark copy must remain **BOR / BLACK ORACLE RESEARCH**.
7. When the identity changes materially, create `v2/`; do **not** silently overwrite v1.

## Relationship to BOT

- **BOR** discovers, verifies and explains.
- **BOT** turns validated decisions into strategy and execution.

Preferred ecosystem line:

> **BOR discovers. BOT executes.**
