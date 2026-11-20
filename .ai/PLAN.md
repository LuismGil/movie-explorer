# Movie Explorer — active release follow-up

> Read this plan before code actions. Update the active backlog in place; do not reopen historical work without an explicit scope change.

The seven-phase v2 execution plan is archived in [`PLAN_v2_complete.md`](context/archive/PLAN_v2_complete.md). R10 is complete. This follow-up is derived from the [engineering roadmap](../README.md#15-engineering-roadmap); there is no further implementation scope approved.

- **R6:** Diagnostic-key removal is operator-confirmed. [Evidence](../docs/AI_RUNTIME_CHECK.md)
- **R8:** Closed by operator-accepted Orca scope amendment. Movie link, Watchlist pressed state, and mocked AI result/error announcements were reported. Focus after removing a Watchlist card, the current-page announcement, and remaining AI states were not verified. This is not a full audit pass or VoiceOver/NVDA coverage. [Evidence](../docs/SCREEN_READER_AUDIT.md)
- **R9:** GitHub Actions #37 and Vercel deployment status passed for candidate `381dff6`; this does not establish the cause of earlier failures or measure live Vercel performance. [Evidence](../docs/LCP_RENDER_RESULTS.md#r9-candidate-ci-closeout)

## Remaining backlog

- [ ] **R11 — Create the `v2.0.0` release tag.** Await explicit authorization and confirm the target SHA before tagging. Keep the evidence tied to the candidate that actually ran; do not imply WCAG, provider, or deployed-performance certification. Do not push commits or tags without authorization.

## Deferred scope

The roadmap's full catalog-to-MCP migration remains deferred, not a v2 release blocker. Coverage for popular movies, trailers and trending pagination is required before replacing the existing TMDB server actions. No new product work, live AI requests, credential changes or quota operations are authorized by this plan.
