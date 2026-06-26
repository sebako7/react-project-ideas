# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Bootstrapped with Create React App (`react-scripts`).

- `npm start` — run the dev server at http://localhost:3000
- `npm test` — Jest + React Testing Library in interactive watch mode
- `npm test -- <pattern>` — run a single test file/name (e.g. `npm test -- HomePage`); pass `--watchAll=false` for a single non-watch run
- `npm run build` — production build to `build/`

There are currently no test files in `src/`. ESLint runs through `react-scripts` (config `react-app` / `react-app/jest` in `package.json`); there is no standalone lint script.

## Architecture

A click-counter game. `index.js` → `App.js` → `HomePage` — `App` is a pure pass-through, so effectively **all** game state and logic live in `src/components/HomePage/HomePage.js`. There is no router, state library, or backend.

Key mechanics in `HomePage`, which are easy to break:

- **`isRunning` is derived state**, not a flag: `isRunning = timer !== 0`. The same button is "start" when idle and "click me" while running — starting sets `timer` to the chosen `duration` and resets `count`; clicking increments `count`.
- **The countdown** runs in a `useEffect` keyed only on `isRunning` (not `timer`), so the interval is created once per round rather than recreated every tick. The tick uses the functional updater `setTimer((prev) => prev - 1)` to avoid a stale closure.
- **Score recording** uses a `prevTimerRef` to detect the exact `1 → 0` transition (round end) in a separate effect, so a score is recorded once per round and never when manually reset. Scores ≤ 0 are ignored.
- **Per-duration leaderboards**: high scores are stored per duration (`DURATIONS = [5, 10, 20]`), keeping the top `MAX_SCORES` (5) sorted descending. They persist to `localStorage` under `STORAGE_KEY` (`"counter-game-highscores"`). `loadScores`/`saveScores` are wrapped in try/catch to tolerate disabled/private-mode storage.

When changing the timer or scoring logic, preserve these invariants: the interval effect must stay keyed on `isRunning`, and score recording must stay on the ref-based `1 → 0` edge — moving either into the wrong dependency set reintroduces interval churn or duplicate/missed scores.
