# Movie Explorer: Security Policy & Guardrails

This document mandates the strict security boundaries for the Movie Explorer ecosystem (Next.js Frontend, Standalone MCP Server, and Multi-Agent Pipeline). All developers and AI agents must strictly comply with these protocols.

## 1. Zero-Exposure API Key Perimeter
* **Client-Bundle Protection:** No environment variables may use the `NEXT_PUBLIC_` prefix for infrastructure or AI keys. 
* **Key Isolation:** `TMDB_API_KEY` and `GOOGLE_AI_API_KEY` must reside strictly server-side. They are exclusively accessible by the Node MCP process or Next.js Server Actions.
* **Leaking Gated Preventions:** AI agents are strictly prohibited from generating code that logs, prints, or exposes raw environment variables via client-side console logs or telemetry payload fields.

## 2. Multi-Agent System (MAS) Guardrails & Injection Defenses
* **Prompt Injection Mitigation:** The Orchestrator Agent must sanitize raw user input strings before embedding them into tool executions.
* **The Quality Gate Constraint:** Raw LLM outputs are categorically barred from being piped directly into the user interface bundle. The Quality Agent (Gemini 3 Flash) must intercept every search result payload to validate factual cross-referencing against raw TMDB responses to eliminate hallucinations and malicious token injections.
* **Content Filtering:** Strict enforcement of safety evaluations. Rejections must throw typed exceptions if unsafe content overrides are detected without explicit permission flags.

## 3. Production Container & Dependency Hardening
* **Runtime Isolation:** The production environment must run exclusively within the designated multi-stage Docker setup utilizing the `gcr.io/distroless/nodejs20-debian12` minimal runner. No package managers (`npm`, `yarn`), shells (`bash`, `sh`), or root privileges are permitted in the runtime container image.
* **Automated Audits:** Dependency vulnerability scanning (`npm audit`) and static application security testing (SAST) must gate every production-bound pull request in the GitHub Actions CI pipeline.

## 4. Client-Facing Vulnerability Prevention
* **Tabnabbing Defense:** Any generated hypermedia link pointing out of the domain (e.g., external TMDB or YouTube links) must explicitly append the `rel="noopener noreferrer"` attributes.
* **Safe Animations & Prefers-Reduced-Motion:** To prevent accessibility-related vestibular distress, animations or programmatic transitions must respect the client's system preferences via media query constraints.