# GKD Subscription

一个用于维护个人 [GKD](https://gkd.li) 订阅的仓库。规则源码写在 `src/`，GKD 快照压缩包放在 `snapshots/`，可以让 AI 根据项目内 skills 从快照生成规则，再通过 GitHub Actions 生成最终的 `dist/gkd.json5` 订阅文件。

## 直接订阅

如果只是想直接订阅当前项目，在 GKD 中添加：

```txt
https://raw.githubusercontent.com/Trrrrw/GKD_subscription/main/dist/gkd.json5
```

如果 raw.githubusercontent.com 访问不稳定，可以使用 jsDelivr：

```txt
https://fastly.jsdelivr.net/gh/Trrrrw/GKD_subscription@main/dist/gkd.json5
```

如果想维护自己的规则订阅，可以参考下面的步骤

## 1. Fork 仓库

先在 GitHub 上 Fork 本仓库到自己的账号下。

Fork 后，后续命令里的仓库地址请换成你自己的仓库地址：

```shell
git clone https://github.com/<你的用户名>/GKD_subscription.git
cd GKD_subscription
```

## 2. 准备环境

需要安装：

- Node.js >= 22: <https://nodejs.org/en/download>
- pnpm >= 9: <https://pnpm.io/zh/installation>
- Python >= 3.10: <https://www.python.org/downloads/>
- 推荐安装 uv: <https://docs.astral.sh/uv/>
- 可选安装 GitHub CLI，用于让 AI 自动触发发布 Action: <https://cli.github.com/>

> [!IMPORTANT]
> GKD 选择器校验需要 Node.js 22 及以上版本。

安装依赖：

```shell
pnpm install
```

如果网络不稳定，可以使用镜像源：

```shell
pnpm install --registry=https://registry.npmmirror.com
```

## 3. 检查订阅信息

打开 `src/subscription.ts`，按需要修改：

```ts
export default defineGkdSubscription({
  id: 233,
  name: "Trrrrw's Subscription",
  author: 'Trrrrw',
});
```

如果你把这个仓库作为自己的订阅使用，建议至少修改：

- `id`：订阅唯一 ID。
- `name`：订阅名称。
- `author`：作者名。
- `supportUri`：你的仓库地址或反馈地址。

## 4. 选择是否保留已有规则

应用规则都在：

```txt
src/apps/
```

每个应用一个文件，文件名通常是应用包名：

```txt
src/apps/com.zhihu.android.ts
src/apps/tv.danmaku.bili.ts
```

如果你不需要本仓库已有规则，可以删除对应文件；如果要继续使用，就保留。

## 5. 放入 GKD 快照

在手机 GKD 中对目标页面导出快照，保留原始 zip 文件。

把 zip 放到：

```txt
snapshots/
```

zip 内通常包含：

```txt
snapshot.json
screenshot.png
```

不需要手动解压，AI 会读取 zip 中的 JSON 快照。

## 6. 让 AI 生成规则

本仓库提供了项目内 skills：

```txt
.codex/skills/gkd-snapshot-rule
.codex/skills/gkd-git-publish
```

生成规则时，可以直接复制下面的提示词：

```txt
使用项目内 skill .codex/skills/gkd-snapshot-rule，
根据 snapshots 下的 zip 文件 生成或更新对应的 GKD 规则。
完成后运行 pnpm run check。
```

更短的提示词也可以：

```txt
根据 snapshots 下的 zip 文件创建 GKD 规则
```

AI 应该完成这些事：

1. 从 zip 中读取 JSON 快照。
2. 读取 `appId`、`activityId`、`appInfo.name` 和节点信息。
3. 找到或创建 `src/apps/<包名>.ts`。
4. 根据可点击的跳过、关闭等节点生成规则。
5. 运行 `pnpm run check`。

生成的规则大致长这样：

```ts
import { defineGkdApp } from '@gkd-kit/define';

export default defineGkdApp({
  id: 'com.example.app',
  name: '示例应用',
  groups: [
    {
      key: 1,
      name: '开屏广告',
      activityIds: 'com.example.app.SplashActivity',
      rules: '[vid="skip"][text*="跳过"]',
    },
  ],
});
```

## 7. 本地校验

每次修改规则后运行：

```shell
pnpm run check
```

如果需要在本地生成订阅文件调试：

```shell
pnpm run build
```

生成结果：

```txt
dist/gkd.json5
dist/gkd.version.json5
```

可以临时启动本地 HTTP 服务：

```shell
python -m http.server 8000 -d dist
```

然后在手机 GKD 中添加本地订阅地址：

```txt
http://<你的电脑局域网IP>:8000/gkd.json5
```

## 8. 发布到 GitHub

本仓库约定 `dist/` 由 GitHub Actions 管理。本地调试产生的 `dist` 修改，不要直接提交。

可以让 AI 使用项目内 skill 处理提交和发布：

```txt
把代码推送到 GitHub
```

AI 应该执行的流程：

1. 查看 `git status --short` 和 diff。
2. 执行 `git restore -- dist`。
3. 执行 `git pull --ff-only`，拉取 GitHub Actions 可能已经提交的 `dist/` 更新。
4. 再次查看 `git status --short`，确认没有 `dist/` 文件。
5. 如果 `dist/` 仍显示为本地修改，再执行一次 `git restore -- dist`。
6. 检查是否有不应该提交的文件，例如 `.env`、私有日志、大文件、无关改动。
7. 如果有可疑文件，停止并让用户决定。
8. 没问题后执行 `git add .`。
9. 运行 `pnpm run check`。
10. 根据实际修改生成 commit message。
11. 执行 `git commit` 和 `git push origin main`。
12. 查看本次提交的文件，例如 `git diff --name-only HEAD~1 HEAD`。
13. 只有本次提交包含 `src/**` 变更时，才使用 `gh workflow run build_release --ref main` 触发发布 Action。
14. 如果触发了 Action，使用 `gh run watch <run-id> --exit-status` 等待完成。
15. 发布成功后执行 `git pull --ff-only`，同步 Action 生成的 `dist` 提交、tag 和 release。

`build_release` 会运行 `pnpm run build`，订阅产物来自 `src/subscription.ts` 及其导入的 `src/**` 文件。只修改 README、项目内 skills、文档或其他非 `src/` 文件时，不需要重新构建 GKD 订阅。

如果 GitHub CLI 未登录或没有 `workflow` 权限，AI 会停止并提示你到 GitHub 页面手动运行：

```txt
Actions -> build_release -> Run workflow
```

手动完整执行也可以：

```shell
git restore -- dist
git pull --ff-only
git status --short
git add .
pnpm run check
git commit -m "feat: add gkd rules"
git push origin main
git diff --name-only HEAD~1 HEAD
gh workflow run build_release --ref main
gh run list --workflow build_release --limit 3
gh run watch <run-id> --exit-status
git pull --ff-only
```

如果 `git diff --name-only HEAD~1 HEAD` 没有输出 `src/` 开头的文件，跳过后面的 `gh workflow run ...`、`gh run watch ...` 和发布后的 `git pull --ff-only`。

## 9. 发布结果

`build_release` workflow 会：

1. 安装依赖。
2. 运行 `pnpm run build`。
3. 更新 `dist/gkd.json5`。
4. 更新 `dist/gkd.version.json5`。
5. 更新 `dist/README.md` 和 `dist/CHANGELOG.md`。
6. 将构建结果提交回仓库。
7. 创建 tag 和 release。

发布完成后，本地仓库应该已经通过 `git pull --ff-only` 同步到最新版本，`git status --short` 应为空。

订阅地址格式：

```txt
https://raw.githubusercontent.com/<你的用户名>/GKD_subscription/main/dist/gkd.json5
```

如果 raw.githubusercontent.com 访问不稳定，可以使用 jsDelivr：

```txt
https://fastly.jsdelivr.net/gh/<你的用户名>/GKD_subscription@main/dist/gkd.json5
```

## 目录结构

```txt
GKD_subscription/
├─ .codex/
│  └─ skills/
│     ├─ gkd-git-publish/
│     └─ gkd-snapshot-rule/
├─ .github/
│  └─ workflows/
│     ├─ build_release.yml
│     ├─ check_fix_push.yml
│     └─ pull_request_check.yml
├─ dist/
│  ├─ CHANGELOG.md
│  ├─ README.md
│  ├─ gkd.json5
│  └─ gkd.version.json5
├─ scripts/
│  ├─ build.ts
│  └─ check.ts
├─ snapshots/
│  └─ *.zip
├─ src/
│  ├─ apps/
│  │  └─ *.ts
│  ├─ categories.ts
│  ├─ globalGroups.ts
│  └─ subscription.ts
├─ package.json
├─ pnpm-lock.yaml
└─ README.md
```

## 版本号

`dist/gkd.json5` 的 `version` 由构建脚本自动维护：

- 第一次构建时，使用 `src/subscription.ts` 中的初始 `version`。
- 如果订阅内容没有变化，构建输出 `No changes`，版本不变。
- 如果订阅内容发生变化，版本自动在旧版本基础上加 1。

通常不要手动修改 `dist/gkd.json5` 和 `dist/gkd.version.json5`。

## 常用命令

```shell
pnpm run check
pnpm run format
pnpm run lint
pnpm run build
```

`pnpm run check` 退出码为 0 时，即使出现 `@gkd-kit/api` 版本提示或 Node deprecation warning，通常也不影响当前规则校验。

## 参考

- GKD 官网：<https://gkd.li>
- GKD API：<https://gkd.li/api>
- Node.js：<https://nodejs.org/en/download>
- pnpm：<https://pnpm.io/zh/installation>
- uv：<https://docs.astral.sh/uv/>
