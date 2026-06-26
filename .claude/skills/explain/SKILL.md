---
name: explain
description: Summarize what the current project is about — its purpose, tech stack, architecture, and how to run it. Use when the user asks "what is this project", "explain this codebase", "give me an overview", or invokes /explain. Best for onboarding to an unfamiliar repo.
---

# Explain

Produce a concise, high-signal summary of the project in the current working directory so the user (or a future Claude session) can get oriented quickly.

## Steps

1. **Gather context efficiently.** Read the highest-signal sources first, and stop once you can describe the project confidently:
   - `CLAUDE.md`, `README.md`, and any `docs/` entry point
   - The manifest for the stack: `package.json`, `pyproject.toml`/`requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`, etc.
   - The entry point and top-level source layout (e.g. `src/`) — read the main file(s), don't enumerate every file
   - For a quick sense of activity, the last few `git log` commits
   - If the repo is large, delegate the search to the Explore agent rather than reading everything yourself.

2. **Write the summary** using the structure below. Keep it tight — favor specifics drawn from the code over generic filler. Omit any section that genuinely doesn't apply rather than padding it.

## Output format

Respond directly in chat (no file) with these sections:

- **What it is** — one or two sentences: the project's purpose and who/what it's for.
- **Stack** — languages, frameworks, and notable libraries, inferred from the manifest.
- **Architecture** — the big-picture structure: entry point, main modules/components, how data/state flows, and any non-obvious design decisions. This is the most valuable section — focus here.
- **How to run it** — the key commands (dev server, build, test), taken from the manifest's scripts or the README. Note if there are no tests.
- **Notable details** — anything surprising, in-progress, or worth a heads-up (e.g. tricky invariants, TODOs, unusual conventions).

## Guidance

- Match depth to the project's size: a small repo gets a few sentences per section; a large one may need delegated exploration and a longer write-up.
- Don't invent commands, features, or structure you didn't verify. If something is unclear, say so rather than guessing.
- Don't dump file trees or paste large code blocks — describe and reference `file:line` instead.
