# Experimental WebMCP integration

WebMCP exposes page-scoped browser tools to compatible agents. It is separate
from the authenticated MCP server in `packages/mcp-server`: the browser tools
do not receive its token or call it, and they do not invoke `/api/ai/search`.
The ordinary interface remains usable when WebMCP is unavailable.

## Tools and scope

| Page | Tool | Behavior |
| --- | --- | --- |
| `/` | `search_movies_catalog` | Search by title and navigate to the results; an empty query shows popular movies. |
| `/` | `get_catalog_results` | Read a bounded portion of the current rendered catalog. |
| `/` | `open_movie_details` | Navigate to the detail page of an ID in the current rendered catalog. |
| `/movie/[id]` | `get_current_movie_details` | Read bounded details of the current movie. |
| `/watchlist` | `get_watchlist` | Read a bounded portion of the watchlist after hydration. |

Catalog and watchlist lists accept `offset` and `limit`; the limit defaults to
five and cannot exceed five. Responses contain JSON text in a WebMCP tool
result. Errors have `isError: true` and a safe error code and message. The
catalog distinguishes an empty list from a load failure. Text sourced from TMDB
or local storage is marked as untrusted.

Search and opening a movie navigate the page. A client should rediscover tools
after navigation rather than assume that the previous document's tools remain
available. The home document uses a declarative search form and loads the shared
catalog module only when `document.modelContext` is available. The React
catalog uses the same catalog contracts.

The watchlist tool is registered only on `/watchlist`; there are no WebMCP
tools for modifying it. The watchlist is local to the browser profile and
origin, but returning it to an agent can share it with that agent and its
provider. Tool annotations are advisory and are not access control. The
existing watchlist storage synchronization behavior is unchanged.

## Local testing

1. Start the application with `npm run dev`.
2. In a supported Chrome version, enable
   `chrome://flags/#enable-webmcp-testing` and restart the browser.
3. Use DevTools **Application → WebMCP** or the
   [Model Context Tool Inspector](https://developer.chrome.com/docs/ai/webmcp#imitate-an-agent-to-test-your-tools)
   to inspect and invoke tools on each page. Agents and inspector extensions
   may send tool results to a model provider.
4. Check the flow: search for a title, read the current catalog results, open a
   listed ID, and read the current movie details. Navigate to `/watchlist`
   separately to inspect the local list.

No Origin Trial token is included. The availability of WebMCP in production
depends on the browser, client, and any applicable Origin Trial enrollment.
Run deterministic tests without a model or live TMDB requests with:

```sh
npm run test -- --run src/lib/webmcp/__tests__/catalog.test.ts src/components/webmcp/__tests__/WebMCPTools.test.tsx app/api/catalog-shell/__tests__/route.test.ts
```

Model-based evaluations should additionally measure tool selection, argument
accuracy, and complete user journeys; they may incur provider costs and are not
part of the default test suite. See
[Chrome's WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals).

## Discovery documents

`/llms.txt` is a public, concise description of the site for agents that choose
to consume it. It neither registers tools nor controls access.

[Agentic Resource Discovery](https://agenticresourcediscovery.org/spec/) is a
separate discovery proposal. This project does not publish an ARD manifest or
advertise its authenticated MCP server through ARD. The proposal's recognized
artifact types do not currently specify a dedicated WebMCP type; choosing a
representation and publicly advertising any resource require separate review.
