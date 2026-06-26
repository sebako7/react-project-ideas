---
name: push
description: Commit the current changes and push them to the remote. Use when the user says "push", "push my changes", "commit and push", or invokes /push. Handles staging, writing a commit message, branch safety, and the push itself.
---

# Push

Take the user's current working-tree changes and get them safely committed and pushed to the remote.

## Steps

1. **Survey the state.** Run `git status --short` and `git branch --show-current`. Note:
   - What's modified, staged, and untracked.
   - The current branch, and whether it's the default branch (`master`/`main`).
   - `git log --oneline @{upstream}.. 2>/dev/null` to see any already-committed-but-unpushed work.

2. **Branch safety.** Never push directly to the default branch. If the current branch is `master`/`main` and there are changes to commit, create a feature branch first (`git checkout -b <descriptive-name>`) unless the user has explicitly said to commit to the default branch.

3. **Decide what to stage.** Look at the changes and stage only what belongs together:
   - Stage the substantive source/test/doc changes for the feature at hand.
   - Do NOT blanket `git add -A`. Leave out transient/runtime artifacts unless asked — e.g. `.claude/agent-memory/`, build output, regenerated `package-lock.json` from a one-off install (this repo's npm proxy rewrites lockfile checksums — see `CLAUDE.md` / repo history).
   - If it's ambiguous which files the user means, ask before staging.

4. **Commit.** If there are staged changes, write a concise commit message: a clear summary line, then a short body explaining the *why* when it isn't obvious. End the message with the required trailer:
   ```
   Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
   ```
   If everything is already committed and the branch is just ahead of upstream, skip straight to pushing.

5. **Push.** Run `git push`. If the branch has no upstream yet, use `git push -u origin <branch>`.

## If the push fails on auth

This repo uses an **SSH** remote (`git@github.com:...`). If you see `Permission denied (publickey)` or `could not read Username`:
- Test with `ssh -T git@github.com`.
- If the key isn't registered, show the user `~/.ssh/id_ed25519.pub` and have them add it to the GitHub account, then retry. Do not silently switch the remote to HTTPS.

## Guidance

- Report back what was committed (hash + summary) and the push result (the `<old>..<new>` ref update).
- Commit and push only the changes that form a coherent unit; if the working tree mixes unrelated work, surface that and ask rather than bundling it all into one commit.
- This is an outward-facing action — if anything about scope or target branch is unclear, confirm before pushing.
