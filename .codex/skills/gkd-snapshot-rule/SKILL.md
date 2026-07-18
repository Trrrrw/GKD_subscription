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
   - When the user says "these snapshots" or gives no exact path, enumerate all `snapshots/**/*.zip` and process each zip.
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
   - Inspect the actual node shape before filtering. In current GKD snapshots, UI fields often live under `node.attr`, for example `node.attr.vid`, `node.attr.text`, `node.attr.desc`, `node.attr.clickable`, `node.attr.visibleToUser`, and bounds fields.
   - Print visible nodes with `id`, `pid`, `attr.vid`, `attr.text`, `attr.desc`, `attr.name`, `attr.clickable`, bounds, `childCount`, and `depth` when the first candidate scan is empty.
   - Do not use snapshot-only `_id` or `_pid` attributes in rules; they are unavailable on real devices. Treat `visibleToUser=true` as a prerequisite for an action target unless the snapshot proves a hidden node is intentionally actionable.
3. Locate the app config at `src/apps/<appId>.ts`.
   - Always trust snapshot `appId` for the target file, not the human app name or previous conversation context.
   - If it exists, read every existing group before editing. Treat the snapshot as evidence for an additional or revised scenario, not permission to replace unrelated groups.
   - If it does not exist, create it with `defineGkdApp({ id, name, groups: [] })`.
4. Identify the action target from `nodes`.
   - Prefer visible, clickable nodes with stable `vid`. When a label is not clickable, prefer its clickable parent or a stable clickable sibling over clicking the text label by coordinates.
   - For skip buttons, prefer the clickable node whose text/desc contains `跳过`, for example `[vid="count_down"][text*="跳过"]`.
   - If a skip label has no stable `vid` and is not clickable, use a nearby stable splash/ad container as a guard in `matches`, then click the text node, for example `matches: ['[vid="homesplash"]', '[text="跳过"]']`.
   - For close buttons, prefer ids like `close`, `close_img`, `iv_close`, or desc/text `关闭`.
   - For homepage popups, add a guard from the same popup when available, such as `desc="广告弹窗"`, `text="广告"`, popup title text, or an ad container `vid`; make the close/skip target the last `matches` item.
   - Use parent/child/sibling relations only when a simple stable attribute selector is ambiguous. Bound descendant searches to a known container; avoid unbounded `<<n` selectors because they can negate query optimizations.
   - Avoid coordinate-only rules unless there is no stable id/text/desc.
5. Classify the scenario before editing:
   - `开屏广告`: startup/splash pages, countdown skip buttons, full-screen ad containers.
   - `后台返回广告`: an ad activity shown after an app resumes from the background. It is distinct from a startup `开屏广告` even if both use a skip button or splash-like UI.
   - `首页弹窗广告`: modal or centered popup after entering the main/home activity.
   - Keep these as separate groups when `activityId` or target behavior differs.
6. Merge the rule group into `groups` without deleting existing coverage.
   - Add a new group when the new snapshot has a different scenario or `activityId` from every existing group. For example, retain `开屏广告` and add `后台返回广告` as a separate group.
   - Update an existing group only when the new snapshot clearly represents that same group; preserve its `key`, name, activity restrictions, and rules unless the snapshot proves a correction is needed.
   - Before saving, compare the group count and keys with the original file. Do not remove or repurpose a group unless the user explicitly requested removal or replacement.
   - Put `activityIds` on the group when all rules in the group share the same activity.
   - Keep `key` stable once created.
   - Use the next unused integer `key` for a new group.
   - Use a concise user-facing `name`, for example `开屏广告` or `首页弹窗广告`.
7. Review the diff before validation.
   - For an existing app file, verify every pre-existing group is still present with the same semantic purpose, unless an explicit removal was requested.
   - State whether the change added a group or updated an existing one in the response.
8. Run `pnpm run check`.
   - Fix TypeScript or selector errors.
   - If `pnpm run check` fails because `node_modules` is missing or incomplete, run `$env:CI='true'; pnpm install` in PowerShell, then retry. This avoids pnpm aborting removal of `node_modules` in a non-interactive shell.
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

- Consult the official GKD references when a snapshot needs selector syntax beyond this workflow: [node attributes](https://gkd.li/guide/node), [selector examples](https://gkd.li/guide/example), [selector syntax](https://gkd.li/guide/selector), and [query optimization](https://gkd.li/guide/optimize).
- Prefer selectors eligible for GKD fast queries. With `fastQuery: true`, the first condition in the final attribute selector must be one of `id`, `vid`, or `text` using `=`, `^=`, `*=`, or `$=`; keep that condition first, for example `[vid="skip"][text*="跳过"]`, not `[text*="跳过"][vid="skip"]`.
- Set `fastQuery: true` only after confirming the required selectors have this form and are marked as fast-queryable in the snapshot inspector. Do not enable it merely to silence a slow-query warning.
- For a one-shot splash-ad skip or popup-close group, set `matchTime: 10000` and `actionMaximum: 1` unless the snapshot shows that the scenario legitimately needs a longer window or multiple actions. Do not add artificial `preKeys`; use them only for a real multi-step action sequence.
- Use `matches` to require every guard and click its last selector. Use `anyMatches` only when any one target is independently safe to click. Add `preKeys` only for a real ordered multi-step flow.
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
