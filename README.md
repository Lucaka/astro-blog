# 🌌 James Universe

一個「可以在 3D 宇宙裡探索」的部落格。每一篇文章都是一顆星星,拖曳旋轉視角、滾輪縮放,點擊星星就能閱讀;縮到最小再繼續滾動,則會離開目前星系、綜覽整個星系群。文章依年代自動分群成星系,主題只是隨著內容成長的宇宙。

主題聚焦在**前端、圖學與隨筆**,介面語言為繁體中文 (`zh-Hant`)。

- 🔭 **線上瀏覽**:<https://www.6ka.dev/>
- 🧪 **多星系預覽**:在網址後加上 `?demo=90`,會注入假資料以測試星系群視角

> 3D 場景需要 JavaScript;關閉 JS 時首頁會自動降級為一份可爬取、可鍵盤瀏覽的純文字文章清單(`<noscript>` fallback)。

---

## 🛠 使用技術

| 領域 | 技術 |
| :--- | :--- |
| 框架 | [Astro 7](https://astro.build)(靜態輸出 + [Islands 架構](https://docs.astro.build/en/concepts/islands/)) |
| 互動元件 | [Vue 3](https://vuejs.org)(透過 `@astrojs/vue`,以 `client:only` 掛載 3D 島嶼) |
| 3D / 圖學 | [Three.js](https://threejs.org)(WebGL、自訂 shader、`UnrealBloomPass` 泛光、重力透鏡效果) |
| 樣式 | [Tailwind CSS v4](https://tailwindcss.com)(`@tailwindcss/vite`)+ 少量 scoped CSS |
| 內容 | [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) + Markdown,程式碼以 [Shiki](https://shiki.style)(`tokyo-night`)上色 |
| 型別 | TypeScript(`astro/tsconfigs/strict`)、`vue-tsc`、`astro check` |
| SEO / feed | `@astrojs/sitemap`、`@astrojs/rss`、JSON-LD 結構化資料 |
| 格式化 | Prettier(`prettier-plugin-astro` + Tailwind class 排序) |
| 套件管理 | [pnpm](https://pnpm.io)(Node ≥ 22.12) |
| 部署 | GitHub Actions → GitHub Pages |
| 選用後台 | [Pages CMS](https://pagescms.org)(見 `.pages.yml`,免後端的網頁編輯器) |

---

## 📁 專案結構

```text
/
├── public/                     # 靜態資產:favicon、og.png、robots.txt
├── src/
│   ├── pages/
│   │   ├── index.astro         # 首頁:載入文章集合並掛載 3D 島嶼
│   │   ├── posts/[slug].astro  # 每篇文章的靜態頁(可分享、可索引、免 JS)
│   │   ├── rss.xml.js          # RSS feed
│   │   └── 404.astro
│   ├── components/             # Vue 元件(3D 場景與 UI:閱讀面板、側欄、圖例…)
│   │   └── BlackHole.vue       # 3D 島嶼主元件,協調整個宇宙的狀態
│   ├── three/blackhole/        # Three.js 場景模組(星空、吸積盤、噴流、透鏡…)
│   ├── content/posts/          # ★ 文章來源:每個 .md = 一顆星星
│   ├── content.config.ts       # posts 集合的 frontmatter schema
│   ├── data/posts.ts           # Post 型別 + 分類 → 顏色/標籤對照
│   ├── utils/                  # 日期、閱讀時間、星系分群等共用邏輯
│   └── styles/global.css       # 全域樣式與 Tailwind 進入點
├── astro.config.mjs            # site / base / 整合 / Shiki 主題設定
└── .pages.yml                  # Pages CMS 設定
```

Astro 會把 `src/pages/` 下的 `.astro`、`.md` 檔各自映射成一條路由。3D 場景與 UI 元件放在 `src/components/`,純 Three.js 場景邏輯則抽離到 `src/three/blackhole/`。

---

## 🚀 快速開始

需要 **Node ≥ 22.12** 與 **pnpm**。

```sh
pnpm install      # 安裝相依套件
pnpm dev          # 啟動本機開發伺服器(http://localhost:4321)
```

所有指令都在專案根目錄執行:

| 指令 | 作用 |
| :--- | :--- |
| `pnpm install` | 安裝相依套件 |
| `pnpm dev` | 啟動本機開發伺服器 `localhost:4321` |
| `pnpm build` | 建置正式站台到 `./dist/` |
| `pnpm preview` | 部署前於本機預覽建置結果 |
| `pnpm astro ...` | 執行 Astro CLI(如 `astro add`、`astro check`) |
| `pnpm format` | 用 Prettier 格式化整個專案 |
| `pnpm format:check` | 檢查格式是否符合(CI 友善) |

---

## ✍️ 撰寫文章

文章集合是整個宇宙的**唯一真實來源**:在 `src/content/posts/` 放進一個 `.md`,下次建置後宇宙裡就會多出一顆星星,無需改動任何程式碼。

frontmatter schema 定義於 `src/content.config.ts`:

```markdown
---
title: 文章標題
date: "2025.04"          # 顯示日期,格式為 YYYY.MM 或 YYYY.MM.DD
category: frontend        # project | frontend | philosophy | blog | demo
tags: ["astro", "webgl"]
summary: 一行摘要,會出現在星星懸停提示與閱讀面板頂端
---

正文從這裡開始……
```

- **分類與顏色**:每個 `category` 對應一種星星色調與標籤,定義在 `src/data/posts.ts` 的 `CATEGORY_META`。
- **閱讀時間**:於建置時自動估算(CJK 以字數、其餘以詞數計算,見 `src/utils/posts.ts`)。
- **自動分群**:文章依年代每 40 篇分成一個「星系」(`src/utils/galaxies.ts`);從最舊的文章開始計數,因此新增文章不會打亂既有星系。
- **網頁後台(選用)**:以 GitHub 登入 [Pages CMS](https://app.pagescms.org) 即可線上編輯 posts 集合,儲存會直接 commit 回本倉庫。

---

## 🎨 設計與互動

整體視覺是一片深色宇宙,黑洞位於中心,四周環繞星空、星雲、吸積盤、噴流與重力網格,並套用泛光與重力透鏡後製效果。互動採**語意縮放(semantic zoom)**:

- **星系視角**:拖曳旋轉、滾輪/雙指縮放;點擊星星開啟文章,懸停可預覽摘要。
- **星系群視角**:縮到底後繼續滾動會觸發「過度捲動離開」手勢(以充能 pill 避免誤觸),鏡頭躍遷到星系群綜覽,每個星系都是可點擊的縮圖。
- **輔助 UI**:左上文章清單(可搜尋、懸停點亮對應星星)、左下分類圖例(篩選)、麵包屑切換視角、首次造訪提示、右下 `?` 操作指南、玻璃擬態面板(`GlassPanel`)。
- **首屏體驗**:3D bundle 載入時先顯示靜態 splash,場景渲染出第一幀後才淡出,避免一片黑畫面。

---

## 🔍 SEO 與無障礙

雖然首頁是 3D 互動場景,但每篇文章都有一份**靜態、可分享、可索引、免 JS 即可閱讀**的獨立頁(`posts/[slug].astro`);首頁開啟星星時會以 `pushState` 同步到對應網址。SEO 相關措施包含:

- 每頁的 `<title>` / `description` / `canonical`、Open Graph 與 Twitter Card 標籤、`og.png` 分享圖。
- **JSON-LD 結構化資料**:首頁輸出 `Blog`、文章頁輸出 `BlogPosting`(內嵌時已跳脫 `<` 以避免破壞 script 標籤)。
- 由 `@astrojs/sitemap` 產生 sitemap、`public/robots.txt` 指向該 sitemap、`rss.xml` 提供 RSS 訂閱。
- `lang="zh-Hant"`、`theme-color`、`apple-touch-icon` 等中繼資料。

無障礙方面:提供 skip link、可鍵盤聚焦的隱藏文章連結、`<noscript>` 純文字降級、以及對 `prefers-reduced-motion` 的支援。

---

## 📦 部署

推送到 `main` 分支時,GitHub Actions(`.github/workflows/deploy.yml`)會自動 `pnpm build` 並發佈到 GitHub Pages。站台網址與 base path 定義於 `astro.config.mjs`:

```js
site: 'https://Lucaka.github.io',
base: '/astro-blog',
```

若要部署到其他網域或路徑,請同步調整 `site` / `base`,以及 `public/robots.txt` 中的 sitemap 網址。

---

## 📚 延伸閱讀

想更了解使用到的技術,可參考 [Astro 官方文件](https://docs.astro.build),或 [Astro Discord 社群](https://astro.build/chat)。
