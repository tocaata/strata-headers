# Chrome Web Store 发布材料

上传包:`../strata-1.0.0.zip`(dist/ 打包,已确认不含测试文件)
截图:`screenshot-1.png`、`screenshot-2.png`(1280×800)
商店图标:`../public/icons/icon128.png`

---

## Store listing(商店信息)

**Name**: Strata — Per-Site Header Rules

**Summary(132 字符内)**:
Modify request & response headers and redirect URLs, with rules isolated per site. Set, append or strip any header.

**Category**: Developer Tools

**Language**: English(可再加中文 listing)

**Description**:

```
Strata modifies HTTP request headers, response headers and redirect URLs —
with one key difference: every rule lives in a profile that is scoped to a
single site, so rules for one domain never leak into another.

FEATURES

• Request headers — set, append or remove any header (Authorization,
  User-Agent, custom X-* headers, …)
• Response headers — e.g. add Access-Control-Allow-Origin for local
  development, strip Content-Security-Policy while debugging
• Redirect URLs — wildcard patterns or RE2 regex with \1–\9 capture
  groups (e.g. rewrite /v1/(.*) to /v2/\1)
• Per-site isolation — each profile is scoped to a domain (subdomains
  included) or a URL pattern; leave the scope empty to apply everywhere
• Three-level switches — master pause, per-profile, per-rule
• Toolbar badge shows the number of active rules; invalid rules (e.g. a
  bad regex) are reported in the popup instead of failing silently
• Duplicate profiles, export them as JSON

BUILT ON MANIFEST V3

Strata uses Chrome's declarativeNetRequest API: headers are rewritten by
the browser's network layer. No content scripts are injected into pages,
nothing slows your browsing down, and the extension cannot read the
traffic it modifies.

PRIVACY

All data stays in your browser's local storage. Strata collects nothing,
transmits nothing, and talks to no server.
```

---

## Privacy tab(隐私填报)

**Single purpose description**:
Modify HTTP request headers, response headers and redirect URLs according to user-defined, per-site rules.

**Permission justifications(每项必填)**:

- `declarativeNetRequest`:
  Core function of the extension — applies the user's header-modification
  and redirect rules at the network layer without reading page content.
- `storage`:
  Stores the user's rule profiles locally so they persist across browser
  sessions. No data leaves the device.
- Host permission `<all_urls>`:
  Users can scope rules to any site they choose (or to all sites), so the
  extension cannot know the target domains in advance. Rules only fire on
  URLs matching the user's own profiles.

**Data usage(数据使用声明)**:全部勾选「不收集」——
Does NOT collect any user data. 勾选三项合规声明(不出售数据 / 不用于与单一用途无关的目的 / 不用于信用评估或借贷)。

**Privacy policy URL**:不收集数据时仍建议提供。可用 GitHub 仓库里的
PRIVACY.md 链接,内容见 `PRIVACY.md`。

---

## 发布步骤

1. **开发者账号**(一次性 $5):
   https://chrome.google.com/webstore/devconsole → 用 Google 账号登录 →
   支付注册费。建议在 Account 页填好联系邮箱并完成验证。
2. **New item** → 上传 `strata-1.0.0.zip`
3. **Store listing**:粘贴上方文案,上传 2 张截图和 128px 图标
4. **Privacy**:按上方填写单一用途、权限理由、数据声明
5. **Distribution**:免费 / 地区全选(或按需)
6. **Submit for review**。注意:`<all_urls>` 宽域名权限会触发深度审核,
   通常几个工作日;权限理由写清楚可显著降低被打回的概率。

## 后续版本更新

改代码 → `npm run build` → 更新 `public/manifest.json` 的 `version` →
重新打 zip → 开发者后台 Package 页上传新包 → 再次提交审核。

可选:用 CLI 自动发布(CI 场景)—— `chrome-webstore-upload-cli`,需要在
Google Cloud Console 建 OAuth 客户端并授权 Chrome Web Store API,得到
clientId / clientSecret / refreshToken 后:
`npx chrome-webstore-upload-cli upload --source strata-1.0.0.zip --extension-id <ID> --auto-publish`
