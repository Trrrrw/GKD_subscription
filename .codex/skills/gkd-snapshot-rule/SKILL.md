---
name: gkd-snapshot-rule
description: Convert a local GKD snapshot zip into an app rule in this subscription project. Use when the user provides a snapshots/*.zip file, file:// snapshot link, or GKD exported raw snapshot zip and asks to create/update rules for开屏广告, 首页弹窗, close buttons, skip buttons, or other UI automation; extract the zip's JSON snapshot, map appId/activityId/nodes into the matching src/apps package file groups, and validate with pnpm run check.
---

# GKD Snapshot Rule

## Workflow

1. Read the snapshot from the user-provided `snapshots/*.zip` path or `file://` link.
   - Snapshot files live under `snapshots/`.
   - Each raw snapshot zip is expected to contain exactly one `.json` snapshot and one `.png` screenshot.
   - For Chinese or URL-encoded paths, prefer locating by the final zip filename or snapshot id:
     `Get-ChildItem snapshots -Recurse -Filter *.zip`.
   - Extract with Python standard library `zipfile` instead of 7z, so the workflow does not depend on a locally installed archive tool.
   - Use any available Python runner. Prefer `python`; use `uv run python` when the environment is managed by uv.
   - Extract to a temporary directory, read the JSON, then remove the temp directory:

```powershell
$zip = Get-ChildItem snapshots -Recurse -Filter *.zip | Where-Object { $_.Name -like '*1782719980176*' } | Select-Object -First 1
$tmp = Join-Path $env:TEMP ('gkd-snapshot-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
$env:GKD_ZIP = $zip.FullName
$env:GKD_TMP = $tmp
python -c "import os, zipfile; zipfile.ZipFile(os.environ['GKD_ZIP']).extractall(os.environ['GKD_TMP'])"
$jsonFile = Get-ChildItem $tmp -Recurse -Filter *.json | Select-Object -First 1
$snapshot = Get-Content -LiteralPath $jsonFile.FullName -Raw | ConvertFrom-Json
Remove-Item -LiteralPath $tmp -Recurse -Force
```

   - If this repository is being used in a uv-managed environment, replace `python -c ...` with `uv run python -c ...`.

   - Use the PNG only as visual context when node data is ambiguous; the JSON is authoritative for selectors.
2. Extract:
   - `appId`: target package name.
   - `activityId`: screen restriction for the rule.
   - `appInfo.name`: app display name if a new app file is needed.
   - `nodes`: candidate UI nodes.
3. Locate the app config at `src/apps/<appId>.ts`.
   - Always trust snapshot `appId` for the target file, not the human app name or previous conversation context.
   - If it exists, update that file only.
   - If it does not exist, create it with `defineGkdApp({ id, name, groups: [] })`.
4. Identify the action target from `nodes`.
   - Prefer clickable nodes with stable `vid`.
   - For skip buttons, prefer the clickable node whose text/desc contains `跳过`, for example `[vid="count_down"][text*="跳过"]`.
   - For close buttons, prefer ids like `close`, `close_img`, `iv_close`, or desc/text `关闭`.
   - Avoid coordinate-only rules unless there is no stable id/text/desc.
5. Classify the scenario before editing:
   - `开屏广告`: startup/splash pages, countdown skip buttons, full-screen ad containers.
   - `首页弹窗广告`: modal or centered popup after entering the main/home activity.
   - Keep these as separate groups when `activityId` or target behavior differs.
6. Add or update one rule group in `groups`.
   - Put `activityIds` on the group when all rules in the group share the same activity.
   - Keep `key` stable once created.
   - Use the next unused integer `key` for a new group.
   - Use a concise user-facing `name`, for example `开屏广告` or `首页弹窗广告`.
7. Run `pnpm run check`.
   - Fix TypeScript or selector errors.
   - Treat dependency version warnings as non-blocking unless the user asked to upgrade.

## Rule Pattern

Use this structure for a single startup skip button:

```ts
{
  key: 1,
  name: '开屏广告',
  activityIds: 'com.example.app.SplashActivity',
  rules: '[vid="skip"][text*="跳过"]',
}
```

Use this structure for a homepage popup when the close button id is generic. The first selector acts as a guard; GKD clicks the last `matches` item:

```ts
{
  key: 2,
  name: '首页弹窗广告',
  activityIds: 'com.example.app.HomeActivity',
  rules: {
    matches: ['[vid="popup_title"][text="活动"]', '[vid="close_img"]'],
  },
}
```

For the current project, local snapshot files such as `snapshots/xxx.zip` are analysis inputs only. Do not put local zip paths in `snapshotUrls`; `pnpm run check` rejects non-URL snapshot values. Only add `snapshotUrls` when the snapshot has been uploaded and the user provides a valid URL.

## Selector Notes

- Use double quotes inside selector strings when the TypeScript string is single-quoted: `'[vid="mSplashBtJump"]'`.
- If the selector itself needs a single quote inside a single-quoted TypeScript string, escape it as `\'` or use a template string.
- Prefer selectors that survive countdown text changes, for example `[text*="跳过"]` instead of `[text="跳过 3"]` or `[text="跳过5"]`.
- If a node has `id: "pkg:id/foo"` and `vid: "foo"`, prefer `[vid="foo"]`.
- If multiple unrelated nodes share a generic close id, add a guard selector from the same popup, such as a title, button text, or unique image/button `vid`.

## Local Build

After `pnpm run check` passes, run `pnpm run build` when the user wants a local `dist/gkd.json5` for device testing. The output file is `dist/gkd.json5`.

## Expected Response

Tell the user:

- Which app file was changed.
- Which snapshot fields drove the rule (`appId`, `activityId`, target node).
- Whether `pnpm run check` passed.
