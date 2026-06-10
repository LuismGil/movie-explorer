# Movie Explorer: Technical Specification

## 1. Intent Classification Matrix (Orchestrator Rules)
The Orchestrator Agent (Gemini 3 Pro) must classify all incoming user strings into exactly one of these 4 intents:
* `browse`: General exploration without specific titles (e.g., "Show me top sci-fi movies").
* `search`: Direct lookup for specific keywords, titles, or people (e.g., "Nolan space movie").
* `recommend`: Contextual or comparative discovery (e.g., "Something like Interstellar").
* `conversational`: Chitchat or system questions (e.g., "Who are you?", "Help me").

## 2. Dynamic Pipeline Flow & Execution Plan
Once the intent is matched, the multi-agent pipeline enforces the following deterministic sequence:
1. **Orchestrator Plan:** Outputs raw JSON satisfying `OrchestratorPlan` schema.
2. **Search Fetching:** Search Agent reads the plan, connects to the MCP server via `stdio`/`SSE`, and triggers tools.
3. **Quality Gate:** Output is intercepted. Quality Agent runs factual validation against raw payload before UI streaming.

## 3. Streaming Response Contracts
All responses from `/api/chat` must adhere to the Vercel AI SDK streaming format. Text tokens stream immediately, while UI entity blocks (Movie Cards) must leverage React 19 `use()` promise resolution to prevent layout shift.