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
