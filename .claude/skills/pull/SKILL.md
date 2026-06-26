---
name: pull
description: Pull the latest changes from the remote into the current branch. Use when the user says "pull", "pull changes", "get latest", "sync with remote", or invokes /pull. Handles dirty-tree safety, choosing merge vs rebase, and resolving the common failure cases.
---

# Pull

Bring the current branch up to date with its remote counterpart, safely — without clobbering uncommitted work or leaving the tree in a half-merged state.

## Steps

1. **Survey the state.** Run `git status --short` and `git branch --show-current`. Note:
   - Whether the working tree is dirty (modified/staged/untracked files).
   - The current branch and whether it tracks an upstream (`git rev-parse --abbrev-ref @{upstream} 2>/dev/null`).
   - `git fetch` first, then `git log --oneline ..@{upstream} 2>/dev/null` to preview what will come in, and `git log --oneline @{upstream}.. 2>/dev/null` to see local-only commits (these signal a divergence that needs merge/rebase).

2. **Dirty-tree safety.** A pull that touches modified files will fail or, worse, force a merge over local edits. If the tree is dirty:
   - Prefer to commit the work first (see the `push` skill) or stash it: `git stash push -m "pre-pull"`.
   - Only stash automatically if the user clearly just wants the latest; otherwise ask. If you stash, remember to `git stash pop` afterward and report any conflicts that surfaces.

3. **No upstream?** If the branch has no tracking remote, don't guess. Ask which remote/branch to pull from, or use `git pull origin <branch>` explicitly.

4. **Pull.** Run `git pull`. If local and remote have diverged, choose deliberately:
   - **Rebase** (`git pull --rebase`) to keep history linear when the local commits aren't shared yet — usually the right default for a personal feature branch.
   - **Merge** (plain `git pull`) when the branch is shared or a merge commit is wanted.
   - If unsure which the user prefers, say which you're using and why.

5. **Report back.** State the result: the `<old>..<new>` ref update and a one-line summary of what came in (or "already up to date"). If you stashed, confirm the pop succeeded.

## If the pull fails

- **Merge/rebase conflicts.** Stop and surface them — list the conflicted files. Don't auto-resolve unless the user asks; if mid-rebase, remind them `git rebase --abort` backs out cleanly.
- **Auth failure.** This repo uses an **SSH** remote (`git@github.com:...`). On `Permission denied (publickey)`, test with `ssh -T git@github.com` and have the user register `~/.ssh/id_ed25519.pub` with GitHub. Do not switch the remote to HTTPS.
- **Local changes would be overwritten.** This means step 2 was skipped — back out, commit or stash, then retry.

## Guidance

- Pulling is generally safe and reversible, but a merge/rebase over local work is not — that's where the care goes. When the tree is dirty or history has diverged, confirm the approach before running the pull.
- Never use `git reset --hard @{upstream}` or `git checkout -- .` to "make the pull work" unless the user has explicitly accepted discarding their local changes.
