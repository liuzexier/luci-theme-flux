# 开发纪要范式

本文件记录 `luci-theme-flux` 的开发、验证和发布约定。每次完成一个可交付变更后，在提交说明或对应任务中按以下格式补充开发纪要。

## 开发纪要

```markdown
## YYYY-MM-DD 变更标题

### 背景
- 为什么需要这次变更。
- 影响的 LuCI 页面、设备或用户场景。

### 变更
- 修改了哪些代码、样式、模板、配置或构建流程。
- 是否涉及兼容旧 UCI 配置、移动端、暗色模式或第三方页面。

### 默认值与配置
- 默认值来源：`htdocs/luci-static/flux/constants.json`。
- 是否修改 UCI 默认配置；如果没有，说明运行时兼容方式。
- 是否需要迁移旧配置或清理缓存。

### 验证
- 执行的命令及结果。
- 覆盖的浏览器、屏幕尺寸、亮暗模式和 LuCI 页面。
- 已知限制或未覆盖项。

### 发布
- Git 提交：`<commit>`
- 版本 tag：`<tag>`
- 构建产物：`<IPK / Release / URL>`
- 部署目标及结果：`<目标设备 / 状态>`
```

## 开发约定

- 默认主题颜色、背景色、玻璃透明度和 Logo 主色统一维护在 `htdocs/luci-static/flux/constants.json`。
- 修改 SCSS 后运行 `pnpm build:css`，不要手工编辑生成的 `htdocs/luci-static/flux/cascade.css`。
- 提交前至少运行：

  ```sh
  pnpm install --frozen-lockfile
  pnpm build:css
  pnpm check:css
  git diff --check
  ```

- LuCI 动态 DOM 和第三方插件页面继续使用语义化 SCSS 兼容层；Flux 自有模板可以使用 Tailwind 工具类。
- 不直接修改用户现有 UCI 主题配置来实现视觉修复。旧配置应在渲染或运行时兼容，除非变更明确要求迁移。
- 移动端、iPad Safari、暗色模式、下拉菜单、弹窗和端口状态页面属于高风险回归区域。
- 发布前确认生成的 CSS 不包含 `@tailwind`、`@use` 或 `@forward`，且生成产物不进入 Git。

## 构建与发布

- 本地样式开发：`pnpm dev`。
- 本地 CSS 构建：`pnpm build:css`。
- 本地 CSS 检查：`pnpm check:css`。
- Linux 上构建 IPK：`scripts/build-ipk.sh`。
- macOS 上通过 `.github/workflows/build-ipk.yml` 构建和发布 IPK。
- 版本号由 `Makefile` 的 `PKG_VERSION` 和 `PKG_RELEASE` 组成，tag 格式为 `v<PKG_VERSION>-r<PKG_RELEASE>`。
- 推送 `main` 后，GitHub Action 会构建 `x86/64` 与 `mediatek/filogic`，并发布对应 Release。发布前必须确认工作区只包含本次变更。
