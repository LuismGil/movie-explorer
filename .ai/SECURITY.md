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

## 3. MCP Server Security
* **Authentication:** The MCP server strictly enforces Bearer authentication (`Authorization: Bearer <MCP_INTERNAL_API_KEY>`) using constant-time comparison. Missing/invalid credentials return a generic unauthorized response. Failures must not reveal existence of server/key/tool/resource. Do not use query-string authentication. Do not create an unauthenticated production MCP endpoint.
* **Transport Restrictions:** Streamable HTTP is the only transport. Local development binds to `127.0.0.1`. The server must validate allowed origins. The MCP client must reject HTTP redirects.

## 4. Production Container & Deployment Hardening
* **Deployment Boundaries:** The MCP server is deployed as a standalone Node.js process to a separate container-capable Node.js hosting provider. It must not be deployed inside the Next.js Vercel application.
* **Automated Audits:** Dependency vulnerability scanning (`npm audit`) and SAST must gate every production-bound pull request in CI.

## 5. Client-Facing Vulnerability Prevention
* **Tabnabbing Defense:** Any external link must explicitly append `rel="noopener noreferrer"`.
