# Self-hosted UI fonts

Sora, Hanken Grotesk and JetBrains Mono retain the cinematic typography.
The checked-in WOFF2 files in `src/theme/fonts/` cover ASCII and the current
Portuguese interface (including uppercased eyebrows). Sora/Hanken retain the
400–700 weight range used by the UI; mono retains its original 500 weight.
Hinting and layout features are retained. Restricting variable weights introduces
at most one font-unit of outline rounding in the sampled fidelity comparison
(1/1,000 em); the glyph designs, sizes and layout are not intentionally changed.

`app/layout.tsx` preloads these three small assets through `next/font/local`,
in the existing root stylesheet. CSS stacks each subset before its complete,
self-hosted original family. Characters outside the subset still
load the complete family's appropriate language asset on demand; dynamic
movie titles/searches are **not** restricted to the subset's character set.
The original language assets live in `src/theme/fonts/full/`, pinned by
`src/theme/full-fonts.json`. Neither builds nor visitors request fonts from Google.

Generated `src/theme/fonts-full.css` uses actual cmap coverage and **disjoint**
Unicode ranges: full faces exclude every primary-subset character, and each
remaining character belongs to one language asset per family. This prevents
duplicate full-font downloads even while an optional UI font loads slowly.
Absent symbols skip directly to the existing platform fallback rather than
probing a full asset whose broad upstream range advertised unsupported glyphs.
The original `optional`/`swap` behavior and Arial fallback metrics are retained.

## Reproduction and integrity

The original Latin WOFF2 assets were obtained from `next/font/google` during
the 2026-11-02 production build. Source CSS queries:

- `https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=optional`
- `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@100..900&display=swap`
- `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=optional`

`src/theme/ui-fonts.json` pins source/output SHA-256, bytes, real cmap coverage
and weights. To regenerate deliberately after a copy change:

```sh
uv run scripts/subset-ui-fonts.py
```

The optional maintenance script pins FontTools 4.68.0/Brotli 1.2.1 and reads
only the committed local original fonts. It rejects unknown upstream
font revisions rather than silently replacing typography. It is **not** a
build dependency. Rebuild and recheck browser coverage/performance afterwards.
Tests pin subset/original binaries, check Portuguese interface/ASCII coverage
and require fallback ranges to exclude primary glyphs without overlaps.

All three families and their subsets are licensed under SIL OFL 1.1. Original
copyright notices/licenses are served alongside the emitted font assets:
`OFL-sora.txt`, `OFL-hanken-grotesk.txt`, and `OFL-jetbrains-mono.txt`.
