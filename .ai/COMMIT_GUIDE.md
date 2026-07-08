# Movie Explorer Commit Guide

## Purpose

This guide defines commit standards for human and AI-assisted changes.

Commits must be:

- atomic
- readable
- reviewable
- scoped
- reversible

---

## Commit Format

Use:

type(scope): short description

Examples:

- feat(admin): add event detail drawer to dashboard
- fix(engine): correct Ed25519 signature verification
- refactor(consumer): extract scanner composable
- docs(api): document event creation payload
- test(wasm): cover tamper detection scenarios
- chore(repo): align pnpm workspace scripts

---

## Allowed Types

- feat
- fix
- refactor
- docs
- test
- chore

---

## Scope Rules

Scope should describe the affected domain or layer.

Good scopes:

- ui
- app
- server
- context
- i18n
- mcp
- agent
- docs
- repo
- test

Avoid vague scopes:

- stuff
- update
- misc
- changes

---

## Description Rules

Description must:

- be short
- be explicit
- use present tense
- stay under 72 characters when possible

Good:

- feat(server): implement server-side TMDB actions
- fix(ui): correct focus-visible outline on movie card
- feat(app): add watchlist page with localStorage integration
- refactor(i18n): extract static text to centralized messages

Bad:

- fix: update things
- refactor(code): improve logic
- chore: changes

---

## Atomic Commit Rule

Each commit should represent one logical change.

Allowed:

- one endpoint
- one bug fix
- one refactor
- one documentation update group

Avoid:

- mixing feature + refactor + docs without reason
- giant dump commits
- formatting-only noise mixed with behavior changes

---

## Commit Sequence Guidance

Preferred order when possible:

1. docs/spec changes
2. domain or contract changes
3. implementation
4. tests
5. integration
6. final docs sync

---

## AI-Assisted Commit Rule

If AI helped generate the change:

- review before commit
- remove meaningless comments
- remove fake placeholder logic
- ensure commit message reflects real behavior

Do not commit raw AI output without cleanup.

---

## Project Scope Mapping

When a change spans multiple directories, use the most specific scope:

| Change Location | Scope |
|---|---|
| `src/components/` | ui |
| `app/` (Next.js pages/layouts) | app |
| `src/server/` or TMDB APIs | server |
| `src/context/` | context |
| `src/i18n/` | i18n |
| `scripts/`, `Dockerfile`, `.github/` | repo |
| Tests, Lighthouse, `test:a11y` | test |
| `.ai/` rules, context, and plan | docs |
| Upcoming MCP server | mcp |
| Upcoming AI agents | agent |

---

## Examples

### Good Commit History

- docs(ai): prepare Phase 6 MCP and multi-agent task plan
- feat(server): isolate TMDB fetching server-side
- feat(app): migrate Vite SPA to Next.js App Router
- test(a11y): integrate headless Axe audit via Playwright
- feat(ui): implement accessible pagination bar
- chore(repo): fix Tailwind purge configuration for Docker
- refactor(i18n): resolve SecureCoder static string warnings

### Bad Commit History

- update files
- fix issues
- more changes
- final fix
