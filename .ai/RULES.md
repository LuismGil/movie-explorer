# Movie Explorer: AI Agent Governance & Rules (RULES.md)

This document establishes the strict execution, architecture, and design rules for any AI agent (Orchestrator, Search, Quality, or IDE coding agents) operating within the Movie Explorer project. 

## 1. Multi-Agent System (MAS) Topology & Token Budget

Agents must strictly operate under their assigned roles and respect finops (cost) limits.

* **Orchestrator Agent (Gemini 3 Pro):** Responsible for intent classification and query planning. Strict limit: 4,096 input tokens per call.
* **Search Agent (Gemini 3 Flash):** Responsible for execution, tool calling (MCP), and context window management. Strict limit: 2,048 input tokens per call. Must respect the semantic cache if embedding similarity is ≥ 0.95.
* **Quality & Safety Agent (Gemini 3 Flash):** Responsible for output validation. Strict limit: 1,024 input tokens. Must validate data consistency and detect hallucinations before rendering the UI. NEVER send raw LLM output to the user interface!

## 2. Data Access & MCP Protocol

* **Raw HTTP Prohibition:** Agents are strictly forbidden from making direct calls using Axios or Fetch to the TMDB API from the client.
* **Exclusive Use of MCP Tools:** All movie data extraction must be done by connecting as a client to the standalone MCP Server and using the typed tools: `search_movies`, `get_movie_details`, `get_recommendations`, `get_trending`, and `get_credits`.

## 3. UI Governance & Design System (Immersive Minimalism)

When generating or modifying React 19 RSC components, agents must adhere to the project's design guide.

* **Design Source of Truth:** All user experience context and visual foundations must be consulted in `docs/ui_ux_principles_design_guide.html`.
* **Use of Design Tokens:** Agents MUST NOT invent arbitrary Tailwind variables, hex values, or custom spacing. They must strictly import and use the predefined design tokens located in the `shared/tokens/` directory.
* **Immersive Minimalism Aesthetics:** Maintain high contrast on dark surfaces, generous use of whitespace, "glassmorphic" depth (`.glass` class), and purposeful micro-animations (e.g., `hover:-translate-y-1`).
* **Safe Animations:** Any CSS transition or animation must be wrapped or conditioned by the `prefers-reduced-motion` media query.

## 4. Accessibility (WCAG 2.1 AA)

No agent is authorized to push code to production if it introduces accessibility regressions.

* **Interactive Elements:** Nesting interactive elements is prohibited (e.g., a `<button>` inside an `<a>` or inside another `<button>`).
* **Focus Rings:** Every interactive element must include the Tailwind utility `focus-visible:ring-2`.
* **ARIA Semantics:** Decorative elements must have `aria-hidden="true"`, pagination buttons or search icons must have descriptive labels (`aria-label`), and active links must use `aria-current="page"`.

## 5. React 19 Architecture

* **Server Components by Default:** Data-heavy pages must be written as async React Server Components.
* **Elimination of Waterfalls:** The use of `useEffect` for data fetching is prohibited; use Server Actions, async promises (e.g., `Promise.all`), and `<Suspense>` boundaries.
* **Client Boundaries:** The `"use client"` directive must be applied solely and exclusively to leaf nodes that require pure user interactivity (e.g., local state management or hooks like Vercel AI SDK's `useChat`).