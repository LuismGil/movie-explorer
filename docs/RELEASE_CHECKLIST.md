# Release closeout — 2026-11-02

The operator authorized completing reachable work, creating atomic Conventional Commits and grouping validation at the end. This checklist separates implementation from evidence. It does not reopen accepted privacy/model/startup decisions or require another live AI experiment.

## Implemented in this closeout batch

- Deferred off-screen QR encoder, reserved its geometry and kept the ordinary link available; optional display/mono fonts and a single mono weight reduce noncritical font work. Responsive poster sources match device needs.
- Named each watchlist action for its movie, preserved distinct poster/save keyboard targets and raised mobile save/filter controls to 44px.
- Assembled standalone static/public assets automatically during `npm run build`; Docker no longer assumes a root `public/` directory exists. CI uses the real Next.js job label, bounded startup and server cleanup.
- Added a browser-JavaScript boundary check to CI. It checks configured credential **values** when supplied and server-only service endpoints, without printing matching source/secrets. Credential-denial regexes and public poster URLs are allowed. This is scoped detection, not a proof against every possible encoding or secret leak.
- Published [the implemented architecture](../ARCHITECTURE.md) and synchronized stale roadmap/operating instructions.
- Replaced the automatically embedded trailer with an accessible, intent-driven loader and an ordinary external link. The privacy-enhanced YouTube frame is created only after activation. Each movie/video gets fresh loader state. Third-party player controls after activation are not certified by our native-page audit.
- Excluded nested dependencies, build output and private environment files from Docker context. The observed context shrank from **141.3 MB to 1.331 MB**.

## Final validation batch

Final checks were grouped after implementation. A test-fixture cleanup issue and automatically loaded third-party trailer accessibility issues were found and corrected before the final applicable rechecks:

| Check | Scope / current status |
|---|---|
| Application lint/types/unit tests | Lint and production-build TypeScript pass. **398 tests pass**, five opt-in Redis cases skipped in the ordinary suite; the separate isolated run below passes all five. Existing ten-mocked-request test verifies real telemetry-handler aggregates without inference. |
| MCP verification | Lint, typecheck, **45 tests** and build pass locally; no hosted MCP probe. |
| Production build / bundled boundaries | Production assembly passes. Scanner inspected **17 browser JavaScript files, zero issues**, with configured local credential values supplied privately to the process; no secret/source matches logged, no network/provider/counter access. |
| Responsive / keyboard / accessibility | Local Chromium covers Home desktop/mobile, saved Watchlist, movie details and Discover. Native-page axe checks, tab focus rings, skip link, saved-state persistence and overflow checks pass in sampled states. Details was rechecked after intent-driven trailer loading: **zero axe violations or missing focus rings**, no external player loaded. Local synthetic region is not deployed geo-trust evidence. QR appears after explicit scroll; AI requests **zero**. |
| Lighthouse | Lighthouse 12.6.1, default simulated throttling, local production. After resource-loading optimization: desktop **100 performance / 100 accessibility / LCP 0.596s / CLS 0**; mobile **96 / 100 / LCP 2.669s / CLS 0**, improved from the initial 2.832s sample. These are samples before the final trailer-only fix, not field guarantees. **The <1.2s mobile goal remains unmet**; thresholds/settings were not relaxed. |
| Isolated Redis / Docker | **Five local Redis integration cases pass**, isolated container removed; no hosted key/counter access. Final Docker image builds and an isolated no-network container serves `/watchlist` and its stylesheet with **200/200**, then is stopped/removed. Legacy-builder deprecation is an environment warning; no BuildKit installation performed. |
| Production dependency audit | Both application and MCP `npm audit --omit=dev` report **zero vulnerabilities**. Development-tool advisories remain, with no forced major upgrades. |

## Mobile LCP follow-up — local commit `cbf00a9`

The fixed headline remains the LCP element. Preload only licensed UI subsets of
Sora/Hanken Grotesk/JetBrains Mono; retain the original complete-family assets
for arbitrary text. Generated, disjoint Unicode ranges prevent full-font
downloads for primary glyphs, including on slow connections. All font assets
are now committed/self-hosted; builds no longer fetch Google Fonts. Sources,
licenses and regeneration: [`public/fonts/README.md`](../public/fonts/README.md).

Final comparison: preserved `eb49dcd` production standalone versus `cbf00a9`,
Lighthouse **12.6.1**, unchanged default **simulated** mobile throttling. Three
fresh-Chrome runs per variant, alternating baseline/candidate, plus one desktop
run each. These are local samples, not field measurements or release certification.

| Metric | Baseline | UI subsets |
|---|---:|---:|
| Mobile LCP samples (seconds) | 2.667 / 2.258 / 2.817 | 2.373 / 2.427 / 2.521 |
| **Median mobile LCP** | **2.667s** | **2.427s (−9.0%)** |
| Median mobile FCP | 1.062s | 0.910s (−14.4%) |
| Median mobile performance score | 97 | 98 |
| Initial font transfer | 91,112 bytes | 49,272 bytes (−45.9%) |
| Median mobile total blocking time | 29.5ms | 37.5ms |
| Desktop LCP / performance, one sample | 0.599s / 100 | 0.530s / 100 |
| Accessibility / CLS, every run | 100 / 0 | 100 / 0 |
| Blocking stylesheet requests | 1 | 1 |
| HTML transfer | 15,085 bytes | 15,173 bytes |

Validation in this follow-up: **411 application tests pass**, five opt-in Redis
tests remain skipped in the ordinary suite; lint, standalone production build,
TypeScript and the 17-file browser-bundle boundary scan pass. No server/AI/MCP
contract changes; the earlier separate Redis/MCP results above are historical,
not newly rerun evidence. Font regeneration is deterministic. Compared 2,049
glyph/weight combinations with the pinned originals: maximum advance rounding
0.5 font units and outline rounding 1 font unit, with 1,000 units per em.

Local browser checks: unchanged headline geometry at **320/412/1440px**, visual
review, no horizontal overflow, keyboard skip link and zero axe violations on
the sampled Home, Watchlist and Discover states. Multilingual probes request the
corresponding original Latin/extended/Greek/Cyrillic assets; display/mono retain
their existing optional-font fallback policy, not a guaranteed first-visit swap.
An additional **150ms RTT / 1.6Mbps / 4× CPU** browser check fetches only the three
UI fonts on initial Home load, with no duplicate full fonts. Zero page errors
and **zero AI requests** across the benchmark/browser checks. Temporary servers
and browsers are stopped. Pre-existing `PRD.md` and the exact dev-reference
`next-env.d.ts` contents are preserved outside commits; no push/deployment.

Rejected experiments: global `experimental.inlineCss` increased HTML transfer
without improving LCP; a headline-only subset and overlapping fallback ranges
did not improve the complete critical path reliably. Neither is shipped.
**The <1.2s mobile LCP goal remains open; no thresholds or measurement settings
were relaxed.** Raw comparison/browser reports remain in `/tmp/opencode/` for
this local session; the figures and conditions above are the durable record.

## Deliberately not fabricated or performed

| Item | Remaining boundary |
|---|---|
| Actual VoiceOver/NVDA audit | Requires those screen readers; automated accessibility/keyboard checks are not equivalent |
| Country-header trust in Vercel | Previously postponed by the user; no new diagnostic or spoof-resistance claim |
| Adult audience eligibility | Self-declaration is not verified age or provider-policy certification |
| Vercel diagnostic-key / old deployment cleanup | Not inspected; no credentials rotated or immutable deployments deleted |
| Enabled hosted AI inference | No additional live inference authorized by this batch; no shared admission/reset/refund |
| New release publication | Local atomic commits are authorized; no automatic push/deployment is inferred here |
| Complete-plan archive / v2.0.0 tag | Remain pending until outstanding checks/goals are actually closed or scope is explicitly amended; do not manufacture closure |

Pre-existing `PRD.md` and the dev-generated `next-env.d.ts` modification are outside these commits. Production build regenerates `next-env.d.ts`; its original dev-reference contents were preserved/restored after validation, rather than silently discarded. Temporary review browsers, app servers and smoke/Redis containers were stopped. No inference, hosted diagnostic, quota reset, credential change, push or deployment was performed by this closeout batch.
