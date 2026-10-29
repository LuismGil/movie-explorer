# Movie Explorer: Security Policy & Guardrails

This document mandates the strict security boundaries for the Movie Explorer ecosystem.

## 1. Zero-Exposure API Key Perimeter
* **Client-Bundle Protection:** No environment variables may use the `NEXT_PUBLIC_` or `VITE_` prefix for infrastructure, MCP, or AI keys. 
* **Key Isolation:** `TMDB_API_KEY` belongs exclusively to the standalone MCP server after Phase 6 migration. `MCP_INTERNAL_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are used by the Next.js server side. The browser never receives these credentials.
* **Leaking Gated Preventions:** AI agents are strictly prohibited from generating code that logs, prints, or exposes raw environment variables. Credentials must never appear in logs. MCP URLs must not contain credentials. Health endpoints must not expose secrets.

## 2. Multi-Agent System (MAS) Guardrails & Injection Defenses
* **Prompt Injection Mitigation:** The Orchestrator Agent must sanitize raw user input strings before embedding them into tool executions.
* **The Quality Gate Constraint:** Raw LLM outputs are categorically barred from being piped directly into the user interface bundle. The Quality/Safety Agent must intercept every search result payload to validate factual cross-referencing against MCP-derived data. It is the only agent allowed to approve final user-visible AI data.
* **Schema Validation:** Zod is the canonical runtime validation library. Every boundary must use explicit schemas (User input, Agent output, MCP tool input/output, UI result). Raw provider text must never be treated as trusted structured data.
* **Streaming Constraints:** Never stream raw model output, raw MCP responses, private prompts, chain-of-thought, tool arguments containing secrets, or unvalidated Markdown or HTML.
* **6.7 Public AI Interlock:** `/discover` and `/api/ai/search` remain disabled for generation by server-owned configuration. Browser fields cannot enable them, inject evidence/dependencies or approve Free Tier. The same-origin/JSON/size/deadline checks are not authentication or rate limiting; do not activate until privacy/eligibility, abuse controls and dependency findings are reviewed. Stream only strict stage/Quality DTO events and wait for clean EOF before presentation; see `docs/STREAMING_UI.md`.
* **6.8 Free-Only Admission:** Before enabled public orchestration, require atomic global Upstash Free admission: one per 60 seconds and ten per rolling 24 hours, including failed/cancelled attempts. `UPSTASH_REDIS_REST_TOKEN` is server-only. Do not store visitor identifiers, prompts, or results; use only fixed-key admission timestamps. Missing/failed/malformed storage denies inference; no refunds, automatic retries, memory fallback, or paid upgrade. The hosted database must be configured and verified before activation. See `docs/AI_OPERATIONS.md`.
* **Temporary D4 operator diagnostic (explicitly approved 2026-10-29):** POST `/api/internal/runtime-check` uses a NEW dedicated `AI_RUNTIME_CHECK_API_KEY`, never a browser/query token or another service credential. No configured key means disabled; reject unauthorized requests before dependency work and never accept caller-selected targets/scripts/queries. Only fixed Upstash PING/EVAL on a UUID diagnostic key with five-second expiry and one fixed authenticated Render movie search are allowed. Never touch the production admission key, Google or AI availability. Apply strict target/response/deadline bounds and sanitized no-store aggregate results; no retries or monitoring. Remove code/key after verification and account for older deployments retaining code/env. See `docs/AI_RUNTIME_CHECK.md`.

## 3. MCP Server Security
* **Authentication:** The MCP server strictly enforces Bearer authentication (`Authorization: Bearer <MCP_INTERNAL_API_KEY>`) using constant-time comparison. Missing/invalid credentials return a generic unauthorized response. Failures must not reveal existence of server/key/tool/resource. Do not use query-string authentication. Do not create an unauthenticated production MCP endpoint.
* **Transport Restrictions:** Streamable HTTP is the only transport. Local development binds to `127.0.0.1`. The server must validate allowed origins. The MCP client must reject HTTP redirects.

## 4. Production Container & Deployment Hardening
* **Deployment Boundaries:** The MCP server is deployed as a standalone Node.js process to a separate container-capable Node.js hosting provider. It must not be deployed inside the Next.js Vercel application.
* **Automated Audits:** Dependency vulnerability scanning (`npm audit`) and SAST must gate every production-bound pull request in CI.

## 5. Client-Facing Vulnerability Prevention
* **Tabnabbing Defense:** Any external link must explicitly append `rel="noopener noreferrer"`.
