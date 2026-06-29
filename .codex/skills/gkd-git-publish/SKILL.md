---
name: gkd-git-publish
description: Prepare and publish local changes for this GKD subscription project. Use when the user wants to commit or push rule/source changes to GitHub while keeping dist fully managed by GitHub Actions; restore local dist changes, pull remote Action-generated dist updates with git pull --ff-only before staging, inspect git status before git add ., stop for user decision if unrelated or unsafe files would be staged, generate the commit message from the actual diff, run pnpm run check, commit, and push.
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

9. Tell the user to run the publishing action after push:
   - GitHub `Actions -> build_release -> Run workflow`
   - That action runs `pnpm run build`, updates `dist/gkd.json5`, `dist/gkd.version.json5`, `dist/README.md`, `dist/CHANGELOG.md`, commits them back, and creates a release/tag when configured.

## Guardrails

- Never use destructive reset commands for this flow.
- Do not discard non-`dist` changes unless the user explicitly asks.
- Do not stage or commit local `dist/` changes in the normal publish flow.
- Pull remote updates with `git pull --ff-only` before staging so local history includes Action-generated `dist/` commits.
- Do not run `git add .` until the status has been inspected and no suspicious files remain.
- If `git status --short` is clean after push, say so.

## Expected Response

Summarize:

- Whether `dist/` changes were restored and absent from `git status`.
- Whether `git pull --ff-only` succeeded.
- What files were committed.
- The generated commit message.
- Whether `pnpm run check`, `git commit`, and `git push` succeeded.
- The next GitHub Action step to generate and commit `dist`.
