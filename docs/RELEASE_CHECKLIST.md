# Release closeout — 2026-11-02

The operator authorized completing reachable work, creating atomic Conventional Commits and grouping validation at the end. This checklist separates implementation from evidence. It does not reopen accepted privacy/model/startup decisions or require another live AI experiment.

## Implemented in this closeout batch

- Deferred off-screen QR encoder, reserved its geometry and kept the ordinary link available; optional display/mono fonts and a single mono weight reduce noncritical font work. Responsive poster sources match device needs.
- Named each watchlist action for its movie, preserved distinct poster/save keyboard targets and raised mobile save/filter controls to 44px.
- Assembled standalone static/public assets automatically during `npm run build`; Docker no longer assumes a root `public/` directory exists. CI uses the real Next.js job label, bounded startup and server cleanup.
- Added a browser-JavaScript boundary check to CI. It checks configured credential **values** when supplied and server-only service endpoints, without printing matching source/secrets. Credential-denial regexes and public poster URLs are allowed. This is scoped detection, not a proof against every possible encoding or secret leak.
- Published [the implemented architecture](../ARCHITECTURE.md) and synchronized stale roadmap/operating instructions.

## Final validation batch

Final results will be recorded here after implementation, without repeated intermediate sweeps:

| Check | Scope / current status |
|---|---|
| Application lint/types/unit tests | Scheduled; tests use mocked services, including aggregate telemetry after ten mocked requests |
| MCP verification | Scheduled locally; no hosted MCP probe |
| Production build / bundled boundaries | Scheduled; no production-counter/provider access |
| Responsive / keyboard / accessibility | Local browser; synthetic region only for layout, AI submissions blocked |
| Lighthouse | Initial baseline: desktop performance 100 / accessibility 100 / LCP 0.593s / CLS 0; mobile 96 / 100 / LCP 2.832s / CLS 0 under simulated throttling. Follow-up after code changes is scheduled. The <1.2s mobile goal is not passed by that baseline. |
| Isolated Redis / Docker | Attempt at the end if the local Docker engine is available; no hosted Redis key |

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

Pre-existing `PRD.md` and the dev-generated `next-env.d.ts` modification are outside these commits.
