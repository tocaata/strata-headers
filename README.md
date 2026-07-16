# Header Editor - Modify Request & Response Headers

类似 ModHeader 的 Chrome 扩展:修改 HTTP **请求头**、**响应头**,以及 **URL 重定向**。
核心特性是 **按站点隔离**:规则按 Profile 组织,每个 Profile 有独立的作用域(Scope),
只对匹配的站点生效,互不干扰。

UI 使用 [Radix UI](https://www.radix-ui.com/primitives)(Tabs / Switch / Select /
Dialog / AlertDialog / DropdownMenu / Tooltip)+ 自定义样式;网络层使用 Manifest V3
`declarativeNetRequest` 动态规则,不拦截页面脚本、无性能开销。

## 构建

```sh
npm install
npm run build     # tsc 类型检查 + vite 打包 → dist/
```

## 安装到 Chrome

1. 打开 `chrome://extensions`
2. 打开右上角「开发者模式」
3. 点「加载已解压的扩展程序」,选择本项目的 `dist/` 目录

## 使用

- **Profile(配置档)**:顶部胶囊条,每个站点一个;`NEW` 创建。每个 Profile 独立开关。
- **Scope(作用域)**:决定规则对哪些 URL 生效
  - 裸域名 `api.example.com` — 匹配该域名及其子域
  - urlFilter 模式 `*://*.example.com/api/*` — 支持 `*` 通配符
  - 留空 — 对所有站点生效
- **REQUEST / RESPONSE**:每条规则 = 开关 + 操作(`SET` / `APPEND` / `REMOVE`)+
  Header 名(常用名有自动补全)+ 值
- **REDIRECT**:来源模式 → 目标 URL;点 `.*` 切换正则模式,正则模式下目标可用
  `\1`–`\9` 反向引用,如 `^https://old\.com/(.*)` → `https://new.com/\1`
- **右上角总开关**:PAUSED 时移除所有网络层规则
- **工具栏徽章**:显示当前生效的规则数;规则被 Chrome 拒绝(如正则不合法)时,
  底部状态栏会显示错误原因
- Profile 菜单(⋮):复制 Profile、导出 JSON 到剪贴板、删除

## 结构

```
public/manifest.json      MV3 清单(declarativeNetRequest + storage)
src/background.ts         Service worker:storage 变化 → 重建 DNR 动态规则 + 徽章
src/shared/rules.ts       纯函数:Profile[] → DNR 规则(可独立单测)
src/shared/storage.ts     chrome.storage.local 封装(无 chrome 环境降级 localStorage)
src/popup/                React + Radix UI 弹窗
scripts/gen-icons.mjs     零依赖生成 PNG 图标
```
