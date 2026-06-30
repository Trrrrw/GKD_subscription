---
name: gkd-git-publish
description: Prepare and publish local changes for this GKD subscription project. Use when the user wants to commit, push, or release rule/source changes to GitHub while keeping dist fully managed by GitHub Actions; restore local dist changes, pull remote Action-generated dist updates with git pull --ff-only before staging, inspect git status before git add ., stop for user decision if unrelated or unsafe files would be staged, generate the commit message from the actual diff, run pnpm run check, commit, push, trigger build_release only when src changes, wait for it, and pull the Action-generated dist commit.
---

# GKD Git Publish

## Workflow

1. Inspect the working tree:

```powershell
git status --short
git diff --name-status
git diff -- .gitignore README.md src package.json pnpm-lock.yaml .github
```

2. Restore generated `dist/` changes before staging.
   - In this project, `dist/` is fully managed by GitHub Actions.
   - Local debugging may modify `dist/gkd.json5`, `dist/gkd.version.json5`, `dist/README.md`, or `dist/CHANGELOG.md`; these changes should not be committed from local workflow.
   - Run:

```powershell
git restore -- dist
```

   - Re-run `git status --short` and confirm no `dist/` files remain in the working tree status.
   - If `dist/` still appears after restore, stop and ask the user how to handle it.

3. Pull the latest remote state before staging.
   - GitHub Actions may have committed updated `dist/` files after the last local pull.
   - Run:

```powershell
git pull --ff-only
```

   - If this fails, stop and report the reason. Do not merge, rebase, or force-push unless the user explicitly asks.
   - After a successful pull, run `git status --short` again.
   - If `dist/` appears as locally modified after the pull, run `git restore -- dist` once more and re-check status.

4. Look for files that should not be staged before running `git add .`.
   - Stop and ask the user if any of these appear:
     - secrets, tokens, `.env`, private logs, personal temp files, large binaries.
     - unrelated source changes outside the requested GKD rule/subscription scope.
     - unexpected deletions.
     - `.codex/` changes when `.codex` is not ignored and the user did not ask to publish local skills.
   - If only expected source changes remain, continue.

5. Stage with the exact command the user prefers:

```powershell
git add .
```

6. Run validation:

```powershell
pnpm run check
```

Treat the `@gkd-kit/api` latest-version warning and Node `DEP0205` warning as non-blocking when the command exits successfully.

7. Generate the commit message from staged changes.
   - Use `feat: add gkd rules` for new or updated rule files.
   - Use `chore: update subscription metadata` for metadata-only changes.
   - Use a more specific message when the diff clearly supports it, such as `feat: add bilibili splash rule`.
   - Do not ask the user for a commit message unless the change intent is ambiguous.

8. Commit and push:

```powershell
git commit -m "<generated message>"
git push origin main
```

If hooks run `pnpm run check`, report pass/fail from the hook output.

9. Decide whether the publishing action is needed after push.
   - `build_release` runs `pnpm run build`, and `scripts/build.ts` builds `dist` from `src/subscription.ts` and files imported under `src/`.
   - Trigger `build_release` only when this source commit changed `src/**`.
   - Skip `build_release` when the commit only changed docs, `.codex/` skills, README, snapshots, workflow docs, or other files outside `src/`.
   - Determine this from the committed diff, for example:

```powershell
git diff --name-only HEAD~1 HEAD
```

   - If no changed path starts with `src/`, stop the release portion and report that no dist rebuild was needed.

10. Trigger the publishing action when `src/**` changed.
   - Prefer `gh` CLI because this workflow is already authenticated on the maintainer machine.
   - First confirm access and workflow availability when needed:

```powershell
gh auth status
gh workflow list
```

   - Run:

```powershell
gh workflow run build_release --ref main
gh run list --workflow build_release --limit 3
```

   - Identify the newest `workflow_dispatch` run ID, then wait for it:

```powershell
gh run watch <run-id> --exit-status
```

   - If the run fails, report the failed job/step and stop. Do not retry blindly.
   - Treat GitHub Actions warnings about Node deprecations or `set-output` as non-blocking when the run exits successfully.
   - The action runs `pnpm run build`, updates `dist/gkd.json5`, `dist/gkd.version.json5`, `dist/README.md`, `dist/CHANGELOG.md`, commits them back, and creates a release/tag when configured.

11. Pull the Action-generated commit after a successful release run:

```powershell
git pull --ff-only
git status --short
git log --oneline -3
```

   - If the pull fails, stop and report the reason. Do not merge, rebase, or force-push unless the user explicitly asks.
   - If `git status --short` is clean after the pull, report that the local checkout is synced with the released version.

## Guardrails

- Never use destructive reset commands for this flow.
- Do not discard non-`dist` changes unless the user explicitly asks.
- Do not stage or commit local `dist/` changes in the normal publish flow.
- Pull remote updates with `git pull --ff-only` before staging so local history includes Action-generated `dist/` commits.
- Do not run `git add .` until the status has been inspected and no suspicious files remain.
- Do not trigger `build_release` until the source commit has been pushed to `origin/main` and its committed diff includes `src/**`.
- If `gh auth status` is not authenticated or lacks `workflow` permission, stop and tell the user to trigger GitHub `Actions -> build_release -> Run workflow` manually.
- If `git status --short` is clean after the final post-release pull, say so.

## Expected Response

Summarize:

- Whether `dist/` changes were restored and absent from `git status`.
- Whether `git pull --ff-only` succeeded.
- What files were committed.
- The generated commit message.
- Whether `pnpm run check`, `git commit`, and `git push` succeeded.
- Whether `build_release` was triggered and completed successfully, or skipped because no `src/**` files changed.
- The Action-generated version commit/tag when available.
- Whether the post-release `git pull --ff-only` succeeded and the working tree is clean.
