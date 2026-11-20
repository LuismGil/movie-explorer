# R8 — Manual screen-reader audit

**Status:** manual walkthrough stopped at the operator's request, with partial Orca evidence recorded below. The operator explicitly authorized Orca on Linux instead of VoiceOver/NVDA. R8 remains open; do not infer a pass for untested cases.

## Setup

1. Start the loopback fixture from the repository: `node --import tsx scripts/serve-r8-audit.ts`. Open **http://127.0.0.1:4088/** in a normal Chrome or Firefox window. Start Orca in the desktop session. Record the OS, browser and reader versions, voice/language and tested revision.
2. The fixture renders the actual `MovieCard`, `Header`, Watchlist page and provider. It replaces Next.js link/router glue with browser navigation; it does not test Next.js navigation behavior or the production Home HTML shell.
3. The mock `AIChatPanel` scenarios are linked at the bottom of every fixture page. Type any synthetic query such as `filmes de teste`. `selection` spaces the progress events and holds EOF after writing the result, `error` returns a service error, `quota` uses a 15-second cooldown, and `cancel` holds the stream open for cancellation. Open the selection link again for a clean retry test or use the retry offered after error/cancellation. Do not submit on the public Discover page or use live inference, production quota or credentials.

## Manual checks

| Component | Exercise | Listen for and record |
|---|---|---|
| `Header` | Navigate by landmarks and links; activate a link and use the skip link where present. | Navigation has a useful name, the correct link is announced as current, and the skip link moves focus to main content. |
| `MovieCard` | Tab to the movie link, then to the separate watchlist button. Toggle add/remove; also test removal in Watchlist. | Movie title and link role, distinct button name and pressed state; location of focus after toggle/removal. |
| `AIChatPanel` | Start with the adult declaration unchecked, then check it. Submit a mocked request with spaced progress events and delayed EOF. Navigate the title-selection result. | Declaration label/state, named input, usable focus order, progress and completion announcements without confusing duplication, no result before EOF, and accessible selection controls. |
| `AIChatPanel` | Use mocked error and quota-limit responses; exercise cancellation and manual retry where offered. | Error or quota feedback is announced, the countdown is not read every second, expiry is announced if tested, and recovery controls are reachable without a focus trap. |

For each case, record the keys used, actual announcement (or silence), focus before/after, pass/fail and reproducible findings. Avoid inferring speech from DOM attributes or an accessibility tree. Record untested cases explicitly and retest any fixes with the same reader/browser before closing R8.

## Preparation evidence

Orca 46.1 and Chrome 157.0.8103.78 are installed in the Linux environment. A loopback-only Playwright smoke check exercised Watchlist add/remove and all four mock AI scenarios. This checked fixture behavior, not Orca speech or manual focus behavior.

An isolated Xephyr/D-Bus run with Orca and native keyboard input captured Orca startup and Chrome window announcements, but not the content announcements. Browser focus reached the fixture controls; the capture limitation is not evidence that the controls were silent on a normal desktop. The audit still needs actual speech observations from the regular desktop session.

## Desktop observations (operator-reported, in progress)

- `MovieCard`, no-poster fixture: the operator heard “sem imagem” and a link announcement, and then confirmed that Orca also read the movie title. The configured speech rate made exact wording hard to distinguish. The toggle name/state and `Header` current-page announcement are not yet recorded.
- The operator could not identify the Watchlist toggle in this walkthrough. Defer that case rather than treating it as passed or concluding that Orca failed to announce it.
- `AIChatPanel`, mocked `selection`: the operator confirmed Orca announced “Qual destes filmes?” without moving focus. This records the result announcement only, not the progress announcements, EOF timing or selection controls.
- `AIChatPanel`, mocked `error`: the operator confirmed the error was announced without moving focus, including “Tente novamente mais tarde ou …”. This verifies the announcement, not keyboard access to the retry control.
