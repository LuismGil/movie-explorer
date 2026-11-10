# Vercel Country-Header Trust Check — 2026-11-09

**Outcome: passed for the tested production request path, with a limited vantage.** The check made four no-body `POST /api/ai/search` requests to production: one without a caller-supplied country header, then with `x-vercel-ip-country` set to `GB`, `US`, and `XX`. All four returned HTTP 403 `adult_confirmation_required`. The app therefore made the same region decision regardless of these supplied values. R5 is closed for this scoped check; this is not a claim of universal geolocation accuracy or a test from a physically restricted-region client.

## Execution and safeguards

- Target: `https://movie-explorer-luis.vercel.app/api/ai/search`.
- All requests had the correct same-origin `Origin` and JSON content type, but deliberately omitted both a request body and the required adult-declaration header.
- In the deployed handler's established order, the regional decision occurs before adult declaration, body parsing, shared admission, MCP preparation, and Google. `adult_confirmation_required` therefore shows that the request passed the region gate and was stopped before body/admission/provider work. No quota was admitted or reset; no MCP or Google call was made.
- The four responses were not page GETs and did not rely on the cached `/discover` HTML. No response body beyond its sanitized error code was retained.
- The first preliminary page-GET comparison was discarded as evidence: all four page requests reported `x-vercel-cache: HIT`, so identical HTML could have been a cache artifact.

| Caller-supplied country | HTTP | Handler decision |
|---|---:|---|
| None (baseline) | 403 | `adult_confirmation_required` |
| `GB` (restricted) | 403 | `adult_confirmation_required` |
| `US` (allowed) | 403 | `adult_confirmation_required` |
| `XX` (unknown) | 403 | `adult_confirmation_required` |

Vercel documents that it adds geolocation headers such as `x-vercel-ip-country` to requests ([request headers](https://vercel.com/docs/headers/request-headers), [middleware geolocation headers](https://vercel.com/docs/routing-middleware#geolocation-headers)). The baseline passed the app's region gate without a caller-supplied value, while attempted restricted/allowed/unknown overrides did not change the decision. This is direct evidence for the deployed request path that Vercel's country signal, rather than those client-supplied values, controlled the decision.

## Limits

- The four requests originated from one external network vantage. No request was made from an actual EEA/CH/UK or unknown-country source, so this does not measure a restricted visitor's end-to-end experience or geolocation accuracy.
- The check establishes behavior of the current tested production request path only; it does not prove every Vercel ingress, proxy, future deployment, or other hosting configuration.
- No diagnostic route was restored, no inference attempted, and no deployment was initiated.
