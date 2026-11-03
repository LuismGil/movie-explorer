# Next increment — profile the mobile render path

Prepared 2026-11-02; investigation completed locally. A small resource-only
optimization is retained, without claiming a reliable LCP improvement.
See [results, samples and remaining limits](LCP_RENDER_RESULTS.md).
Font-loading runtime baseline: `cbf00a9`; validation record: `26d818e` and
[the release checklist](RELEASE_CHECKLIST.md). The operator explicitly authorizes
commit/push of that increment and this preparation. A push is not Vercel Ready
or a complete release certification.

## Starting evidence

- Unchanged Lighthouse 12.6.1 simulated mobile settings: three-run median
  **LCP 2.427s**, FCP 0.910s, performance 98, accessibility 100, CLS 0.
- Font transfer is now **49,272 bytes**, down 45.9%; the sampled slow connection
  requests only the three UI subsets, without duplicate complete fonts.
- The LCP element is still `h1#catalog-title`, not a poster.
- In the median-LCP candidate report: TTFB 454.856ms, estimated render
  delay 1,971.856ms (**81%**), nine script requests/150,284 transferred bytes.
  The recorded unthrottled LCP was 163ms; this is **not** the simulated result.
- Whole-trace style/layout 475.768ms and script evaluation 418.572ms suggest
  investigation areas, not proven pre-LCP costs. Some script/network activity
  happens after paint. Do not sum these values into a causal explanation.
- The strict **LCP <1.2s** goal remains open. Existing variation includes a
  faster old-baseline sample; compare distributions, not a selected best run.

## Execution order

1. **Freeze the post-font baseline before another build.** Preserve its assembled
   standalone/assets outside the repository in `/tmp/opencode/`, without private
   environment files. Confirm its source is `cbf00a9` or a documentation-only
   descendant. Keep the older `eb49dcd` snapshot as historical evidence, not the
   baseline for the next candidate. Missing temporary artifacts must be rebuilt
   from known source without resetting or overwriting the user's working tree.
2. **Capture attributable traces.** Save Lighthouse trace/devtools-log artifacts
   and a sanitized summary, not just the final audit JSON. Identify stylesheet
   completion, font readiness, first headline paint, script evaluation,
   hydration, layout work and streamed catalog arrival. Distinguish actual
   timestamps from Lantern's simulated estimates and pre-LCP from post-LCP work.
3. **Rank only supported hypotheses.** Inspect `app/layout.tsx`, `app/page.tsx`,
   `Header`, `SearchBar`, `MovieCard` and `WatchlistProvider` boundaries only as
   the trace warrants. Check route prefetch/QR work separately. The intro is
   already server-rendered; do not assume a client rewrite or move is needed.
   Separate application bytes from framework bytes before proposing a split.
4. **Test one reversible change.** If evidence supports it, narrow an application
   client boundary or defer genuinely noncritical work without delaying normal
   interactions. Consult installed/current framework docs before changing its
   APIs. Do not manually suppress Next.js scripts, hide/replace the LCP element,
   move content merely to change the metric, or reintroduce rejected inline-CSS
   and overlapping-font experiments without new evidence.
5. **Batch final validation.** Run lint/types/build, application tests and the
   client-bundle scan after the candidate is complete. Alternate at least three
   fresh-Chrome mobile runs per baseline/candidate with identical unchanged
   Lighthouse settings; report all samples, medians, FCP/TBT, transfer and desktop
   behavior. Use real network/CPU throttling as an additional check, not a
   replacement for the established simulated comparison.

## Acceptance and stop conditions

- Retain only a reproducible improvement against the **post-font** baseline,
  with no material FCP/TBT/interaction regression. If results overlap or change
  with collection timing, gather more evidence or discard the candidate.
- Preserve the obsidian/gold design, canonical fonts, dynamic-title glyph
  support, keyboard/touch targets, reduced motion and mobile layout. Recheck
  320/412/1440px, axe, CLS, search/trending/pagination and saved-watchlist
  hydration/persistence. Check slow-font behavior and cold/returning navigation.
- Keep the catalog worldwide. Do not change AI activation, regional/adult gates,
  provider/model, shared admission or request budgets. Block/count AI search
  requests in performance/browser harnesses; require **zero**. No live inference,
  quota reset, hosted diagnostic or new service is authorized by this plan.
- Completing this increment does not mark phase 7.8 closed. Do not
  relax `lighthouserc.json`, archive the full plan or tag a release because a
  candidate improves without reaching the existing 1.2s target.
- Preserve `PRD.md` and the exact pre-task `next-env.d.ts` contents outside
  commits; restore the latter after builds. Clean up temporary servers/browsers.

Session-only starting reports: `/tmp/opencode/lcp-final-summary.json`,
`lcp-final-ui-mobile-2.json` and `movie-font-browser-summary.json`. They may expire;
the durable starting evidence is the release checklist, not their existence.
