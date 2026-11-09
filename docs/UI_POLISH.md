# Phase 7 — Cinema presentation

Started **2026-11-02**, after the user reported deployment `8819583` Ready and explicitly approved proceeding with UI work while earlier release limitations remain documented. This is an approved phase-order amendment, **not** retroactive certification of Phase 6's unverified items.

**Subsequent closeout:** first visual delivery `b6a9af0` is committed/pushed; later work is in local atomic commits. Resource loading, accessible movie-specific save actions, intent-driven trailer loading, standalone packaging and CI/bundle protection are complete. The 2026-11-02 batch below recorded mobile LCP 2.669s; the later R2 shell candidate met the unchanged local gate with two medians of **1,056.398ms / 1,060.342ms**, accessibility 100 and CLS 0. Commit `3fe0b6b` was pushed and production GETs served the shell, but no hosted Lighthouse run or independent Vercel Ready/CI result is recorded. See [R2 results](LCP_RENDER_RESULTS.md). The earlier batch's app/MCP test counts, lint/typechecking, browser/keyboard and Docker smoke remain evidence for that scope only.

## Direction

The existing `shared/tokens` are the visual source of truth: obsidian `#0E0E0E`, canvas `#131313`, elevated surfaces `#1C1B1B`, gold `#F5C518`, warm text `#E5E2E1`/`#D1C5AC`, purple `#DAB9FF` for saved state. The older plan's example cyan/pink palette was not introduced as a second competing theme.

Sora display, Hanken Grotesk body and JetBrains Mono utility typography load through `next/font/google`, self-hosted after build with Latin subsets. Body uses swap; display/mono now use optional rendering so slow connections can keep the adjusted system fallback instead of forcing a late swap. Mono is one weight and not preloaded. Shared theme variables connect these fonts to the AI panel. No runtime Google Fonts stylesheet is added.

The catalog is poster-led, with a typographic “Menos rolagem. Mais cinema.” opening, restrained gold navigation and monospaced year/rating details. Titles, ratings and save controls remain visible without hover; no fictitious curation, streaming availability, user counts or AI results are presented.

## Implemented

- Responsive sticky header with film mark, active navigation underline, keyboard focus and a mobile navigation row.
- Catalog intro, accessible search/clear action, pressed-state filters and responsive poster grid. Existing debounce/URL/data-fetching behavior stays intact; no extra hero data request.
- Cards with reserved poster ratios, subtle gradient, rating pill, visible title/year, separate watchlist button, capped stagger and hover lift only when motion/hover are supported. First-row catalog posters load eagerly; remaining posters remain lazy.
- Matching shimmer skeleton geometry, empty results/watchlist, saved-in-this-browser explanation and branded catalog error state.
- Real App Router `app/error.tsx` boundary using a branded reset/catalog fallback; raw exception details are not rendered or logged there.
- Production-only mobile QR, rendered locally by `qrcode.react@4.2.0`; it encodes the current origin plus `/discover`, never path/query parameters or credentials. A fixed-size placeholder avoids QR hydration layout changes. Scanning only opens the existing gated page, never submits inference. No third-party QR image service.
- AI input/buttons, self-declaration legend, inline terms link, real pending-only activity dots and capped result reveal; no change to request, age, regional, quota, provider or runtime contracts.
- Shared typography/background in the layout, matching detail-page primary controls, and a factual TMDB attribution footer.
- Global reduced-motion override; motion effects are opt-in via `prefers-reduced-motion: no-preference`.

## Dependency change

Installing the planned QR dependency also surfaced an existing production advisory for `follow-redirects@1.16.1` (GHSA-mrwp-f3q8-3g9p). Only that transitive package was updated within its compatible range to `1.16.2`. `npm audit --omit=dev` subsequently reported **zero vulnerabilities**. Development-tool advisories remain; no broad `audit fix`, forced migration, payment or major upgrade was performed.

## Local evidence and limits

- Production build (including TypeScript) and lint passed. Four focused UI suites passed **35 tests**, including production-only QR payload, boundary reset, active navigation, watchlist toggle and existing AI panel regressions.
- Local production Chromium review covered Home at 1440/390px, Watchlist at 320px and Discover at 1440/320px. All five had **no WCAG A/AA axe violations, page errors or horizontal overflow** in the sampled states. Home rendered 20 real catalog cards; ordinary read-only TMDB/poster requests occurred.
- Discover used an explicitly synthetic `BR` header **on localhost**, solely to review the enabled self-declaration layout. This is not a Vercel geo-trust test. AI submissions were blocked by the browser harness and **zero AI requests** occurred. No Gemini, MCP, Upstash or shared-counter operation was requested by the review.
- Reduced-motion inspection returned card animation `none` and transition duration `0s`.
- Screenshots: `/tmp/opencode/cinema-*.png`; temporary review server/browser stopped. Inspection prompted a more compact adult legend and an inline rather than pill-shaped terms link.
- Lighthouse budgets **have not been measured** for this increment; do not claim LCP <1.2s, CLS <0.05, screen-reader certification or complete Phase 7 closure. No live AI, broad full-suite, Docker or hosted diagnostic experiment was repeated.

Changes remain local until explicitly committed/published. Existing Phase 6 limitations in [`AI_RELEASE.md`](AI_RELEASE.md) are unchanged.
