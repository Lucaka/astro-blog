# 遷移規劃:GitHub Pages → Cloudflare + Keystatic CMS

> 目標:把站台從 GitHub Pages(純靜態)搬到 Cloudflare(支援 SSR),並用
> **Keystatic** 取代 Pages CMS,取得「自架、型別安全、GitHub 登入即線上編輯」
> 的後台。內容仍是 `src/content/posts/*.md`(source of truth 不變)。

## 為什麼 Cloudflare 讓 Keystatic 成立

Keystatic 的 GitHub 模式需要 server 端 route(OAuth 回呼 + 內容讀寫 API)。
GitHub Pages 是純靜態跑不了;Cloudflare Pages/Workers 支援 SSR,所以這幾條
動態 route 有地方跑。**內容頁維持靜態、只有 `/keystatic` 走 SSR** — 混合模式
讓 SEO(canonical / OG / JSON-LD / RSS / sitemap)完全不受影響。

---

## 現況盤點(已確認)

| 項目 | 現值 | 影響 |
|------|------|------|
| `astro.config.mjs` | `site: https://Lucaka.github.io`、`base: /astro-blog` | 需改 |
| 連結產生 | 全走 `import.meta.env.BASE_URL`(`postPath` 等) | ✅ 改 base 自動適配,免動程式 |
| 文章媒體路徑 | **無**任何文章硬寫 `/astro-blog/media` | ✅ 無需批次改文 |
| `public/media` | 目前為空 | ✅ 無遷移負擔 |
| 部署 | `.github/workflows/deploy.yml` → GitHub Pages | 需替換 |
| CMS | `.pages.yml`(Pages CMS) | 移除 |
| 框架島 | Vue 3D 場景;Keystatic 後台是 **React** | 需加 `@astrojs/react`(僅後台用) |

---

## 步驟

### 1. 加入 Cloudflare adapter(啟用 SSR)

```
pnpm astro add cloudflare
```

`astro.config.mjs`:

```js
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://<你的網域或 astro-blog.pages.dev>",
  // base 移除(改用根路徑 /);若仍要子路徑再保留
  adapter: cloudflare(),
  // output 維持預設 static:內容頁全部預先渲染,
  // 只有 Keystatic 的 route 標記 prerender=false 走 SSR。
  ...
});
```

> **重點**:預設 `output: "static"` 下,加了 adapter 後,只有標記
> `export const prerender = false` 的 route 會即時渲染。`index.astro`、
> `posts/[slug].astro`、`rss.xml.js`、`404` 全部維持靜態,零效能/SEO 影響。

### 2. 調整 base / site 帶來的連動

- `site` 換成 Cloudflare 網域 → `@astrojs/sitemap`、`Astro.site`、canonical、
  RSS 的絕對網址自動跟著更新。
- `base` 由 `/astro-blog` 改成 `/`(或移除)→ `postPath`、`BASE_URL` 相關全部
  自動適配,**不需改任何 `.ts`/`.astro`/`.vue`**(已驗證)。
- `.pages.yml` 的 `output: /astro-blog/media` 隨 Pages CMS 一起移除。
- 若沿用自訂網域,記得 Cloudflare 設定 DNS + Pages 綁定。

### 3. 導入 Keystatic

```
pnpm add @keystatic/core @keystatic/astro
pnpm astro add react            # Keystatic 後台 UI 是 React;只在 /keystatic 載入
```

`astro.config.mjs` integrations 加入 `keystatic()`(放在 `react()` 之後)。

新增 `keystatic.config.ts`(對齊現有 `content.config.ts` schema):

```ts
import { config, fields, collection } from "@keystatic/core";

export default config({
  storage: { kind: "github", repo: "lucaka/astro-blog" }, // 本地開發可先用 kind: "local"
  collections: {
    posts: collection({
      label: "文章 (Posts)",
      slugField: "title",
      path: "src/content/posts/*",
      format: { contentField: "body" },
      schema: {
        title: fields.slug({ name: { label: "標題" } }),
        date: fields.text({
          label: "顯示日期",
          description: '格式 YYYY.MM 或 YYYY.MM.DD',
          validation: { pattern: { regex: /^\d{4}\.\d{2}(\.\d{2})?$/ } },
        }),
        category: fields.select({
          label: "分類",
          options: [
            { label: "project", value: "project" },
            { label: "frontend", value: "frontend" },
            { label: "philosophy", value: "philosophy" },
            { label: "blog", value: "blog" },
            { label: "demo", value: "demo" },
          ],
          defaultValue: "blog",
        }),
        tags: fields.array(fields.text({ label: "標籤" }), {
          label: "標籤", itemLabel: (p) => p.value,
        }),
        summary: fields.text({ label: "一行摘要" }),
        body: fields.markdoc({ label: "內文" }),
      },
    }),
  },
});
```

Keystatic 會自動掛上 `src/pages/keystatic/[...params].astro`(後台 UI)與
`src/pages/api/keystatic/[...params].ts`(API),兩者標記 `prerender = false`。

### 4. GitHub App 認證(GitHub 模式)

1. 進 `/keystatic`,依引導建立一個 GitHub App(Keystatic 有精靈流程)。
2. 取得 client id / secret,連同一組隨機 `KEYSTATIC_SECRET`,設進
   **Cloudflare Pages 環境變數**:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
3. 本地開發可先用 `storage: { kind: "local" }`(讀寫本機檔案、免認證)驗證流程。

### 5. 替換部署

移除 `.github/workflows/deploy.yml`(GitHub Pages),改用 Cloudflare Pages:

- **建議**:Cloudflare Pages 的 Git 整合 — 綁 repo、build command `pnpm build`、
  output 目錄 `dist`,push 到 `main` 自動部署。Astro Cloudflare adapter 產出的
  worker/functions 會被 Pages 自動接手。
- 或用 `wrangler pages deploy` 走 GitHub Actions(需 `CLOUDFLARE_API_TOKEN`)。

---

## ⚠️ 需要注意的取捨

1. **Markdoc vs 現有 Markdown 語法**
   Keystatic 的富文本(`fields.markdoc`)輸出 Markdoc 風格,而現有文章用
   `remark-directive` 的 `:::info` / `:::warning` callout 與 GFM。**用 Keystatic
   編輯器重存舊文可能不認得 `:::` 語法或重排格式。** 選項:
   - (a) 保留 `fields.markdoc`,接受新文用 Markdoc、舊文避免經編輯器重存;或
   - (b) 用 `fields.markdoc` 但另設 Markdoc tag 對應 callout;或
   - (c) 保守做法:body 用純文字/較簡單的 markdown 欄位,維持你既有的
     remark 管線在 build 時處理。
   → 建議遷移時先拿 1~2 篇舊文實測 round-trip,再決定。

2. **React 進場**:Keystatic 後台需要 `@astrojs/react`。它只在 `/keystatic`
   載入,不影響 Vue 3D 首頁的 bundle,但 devDependencies 會多一組 React。

3. **首篇部署驗證**:搬完先確認 `noscript` 靜態列表、`[slug]` 頁、RSS、sitemap
   在新網域下網址正確(canonical 用新 `site`)。

4. **舊網址轉址**:若已被索引,`Lucaka.github.io/astro-blog/...` 換新網域後,
   視需要在 Cloudflare 設 301。

---

## 建議執行順序

1. 先開 `storage: kind: "local"` + 現有 GitHub Pages 不動 → 本地把 Keystatic
   config、schema、Markdoc round-trip 驗證清楚。
2. 再一次性切換:Cloudflare adapter → base/site 調整 → GitHub 模式認證 →
   替換部署 workflow → 移除 `.pages.yml`。
3. 上線後驗 SEO 與轉址。

## 受影響檔案清單

- `astro.config.mjs`(adapter、site、base、加 react/keystatic integration)
- `keystatic.config.ts`(新增)
- `src/pages/keystatic/…`、`src/pages/api/keystatic/…`(Keystatic 自動產生)
- `package.json` / lockfile(新增依賴)
- `.github/workflows/deploy.yml`(移除或改 Cloudflare)
- `.pages.yml`(移除)
- `README.md` / `AGENTS.md`(更新 CMS 與部署說明)
