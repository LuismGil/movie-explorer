# Movie Explorer: Architecture & Structural Truth

This document defines the 2026 senior-level target architecture for Movie Explorer. [cite_start]It serves as the "structural truth" of the system[cite: 11]. [cite_start]Any AI agent operating in this repository MUST read and adhere to these architectural guidelines before touching the code[cite: 10].

## 1. Frontend Topology (React 19 & Next.js)

[cite_start]The application is migrating from a traditional Vite SPA to a server-rendered architecture using Next.js App Router[cite: 16, 70].

* [cite_start]**Server Components by Default:** Data-heavy pages are written as async React Server Components (RSC) to completely eliminate client-side data fetching waterfalls[cite: 16].
* **Client Boundaries:** The `"use client"` directive is reserved strictly for leaf nodes requiring interactivity, such as local state management for the Watchlist or the Vercel AI SDK `useChat` hook.
* **Suspense & Streaming:** The UI utilizes `<Suspense>` boundaries to stream structural fragments to the client while parallel asynchronous data requests (e.g., `Promise.all` for details, credits, and recommendations) are resolved on the server.

## 2. MCP (Model Context Protocol) Server

To eliminate raw HTTP coupling in the client and provide AI agents with secure, structured access to TMDB, the system implements a standalone MCP Server.

* [cite_start]**Standalone Process:** The MCP server operates independently from the main React application[cite: 12].
* [cite_start]**Discoverable Tools:** It acts as an active catalog [cite: 31][cite_start], exposing the TMDB API through 5 typed tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, and `get_credits`[cite: 32].
* **Strict Security:** The `TMDB_API_KEY` is maintained exclusively on the server side and is consumed solely by the MCP Server or Server Actions. [cite_start]It is never exposed to the client bundle[cite: 69].

## 3. Multi-Agent System (MAS) Orchestration Pipeline

[cite_start]Movie discovery transitions from basic keyword searches to a conversational, semantic pipeline powered by a 3-agent ecosystem[cite: 12, 73].

* **Orchestrator Agent (Gemini 3 Pro):** The "brain" of the operation. [cite_start]Responsible for intent classification and query planning[cite: 40]. Operates under a strict budget of 4,096 input tokens per call.
* [cite_start]**Search Agent (Gemini 3 Flash):** The "muscle" and investigator[cite: 31, 40]. [cite_start]It connects to the MCP Server autonomously, executes tool calls, aggregates and deduplicates data, and handles context windowing to prevent overloading the system[cite: 33, 35, 39]. Operates under a 2,048 input token limit and leverages a semantic cache (similarity ≥ 0.95).
* [cite_start]**Quality Agent (Gemini 3 Flash):** The reviewer[cite: 43]. [cite_start]It cross-references the Search Agent's output against the raw TMDB data to prevent hallucinations and ensure content safety before rendering the UI[cite: 43]. Operates under a 1,024 input token limit.

## 4. UI Governance (Immersive Minimalism) & Accessibility

The presentation layer is strictly governed by design and legal accessibility standards.

* [cite_start]**Design System:** Follows the "Immersive Minimalism" visual language[cite: 51, 73], relying on design tokens (located in `shared/tokens/`). This includes high-contrast dark surfaces, "glassmorphic" depth (`.glass`), and purposeful micro-animations protected by `prefers-reduced-motion` media queries.
* [cite_start]**WCAG 2.1 AA Compliance:** The codebase must maintain the established accessibility baseline[cite: 48, 69].
    * No nested interactive elements (e.g., `<button>` inside `<a>`).
    * Global visibility of focus rings via `focus-visible:ring-2`.
    * Strict adherence to semantic ARIA attributes (e.g., `aria-hidden="true"` for decorative elements, `aria-current="page"` for active navigation).