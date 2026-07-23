# 多國語系(i18n)遷移規劃

> 狀態:**Phase 1–4 已實作**(基礎建設 + 抽字串 + `/en/` 站與 SEO + 翻譯
> 基建與標籤頁 i18n);Phase 5(收尾)待辦。本文回答「Astro 是否有像
> vue-i18n 的多國語系方案」,並依本專案現況制定遷移步驟。

## 實作進度

- ✅ **Phase 1 基礎建設**:`astro.config.mjs` 加入 `i18n`(`zh-hant` 預設、
  不加前綴);新增 `src/i18n/`(`config.ts` 語系登錄、`ui.ts` typed 字典、
  `index.ts` `useTranslations`、`vue.ts` island 用 provide/inject)。
- ✅ **Phase 2 抽字串**:index / [slug] / 404 / rss、`utils/posts`
  (`postMeta`)、`utils/galaxies`(移除 locale 綁定的 `name`)、
  `three/blackhole/galaxyImpostors`(canvas 標籤)、以及 7 個 Vue 元件全部
  改由字典供字。**zh-Hant 靜態輸出經 byte-level 比對:除 index 島嶼多帶一個
  `locale` prop 外,63 頁全數不變。**
- ✅ **Phase 3 頁面複製與 SEO**:頁面主體抽成共用元件
  `src/components/pages/{UniverseIndex,PostArticle,NotFound}.astro`,`src/pages/`
  下的檔案變薄殼;新增 `/en/` 整條路由(index / posts / 404 / rss)。SEO:
  首頁對互指 hreflang + `x-default`→zh-hant、各語系 canonical 指自己;內容尚未
  翻譯,故英文單篇頁為 **fallback**——中文原文內文 + 英文介面 + 「尚無翻譯」
  提示,且 `canonical` 指向中文原文以合併重複內容(sitemap 亦排除這些
  fallback 單篇頁,只列 canonical URL)。新增 `LanguageSwitch` 元件(首頁右上
  浮層、單篇頁頁首),用 `getRelativeLocaleUrl` 產生對應連結。
- ✅ **Phase 4 翻譯基建 + 標籤頁 i18n**(**決策:採兄弟檔;翻譯內容先不做,
  只建基建**):
  - **內容結構**:英文翻譯採**兄弟檔** `<slug>.en.md`(既有 61 篇完全不動)。
    `content.config.ts` 的 `posts` 集合以 `!**/*.en.md` 排除翻譯檔;新增
    `postTranslations` 集合載入 `*.en.md`(只需 `title` / `summary`,`date` /
    `category` / `tags` 由原文繼承),並用 `generateId` 保留 `<slug>.en` 這個
    id(預設 slugifier 會把 `deno.en` 變成 `denoen`)。
  - **自動升級**:`PostArticle` 改吃 `translation` prop 自動判定——非預設語系
    且存在翻譯時渲染英文標題/摘要/內文、canonical 指自己、補雙向 hreflang +
    `x-default`、移除「尚無翻譯」提示;否則 fallback。兩語系頁面都只在**翻譯
    存在時**才互指 hreflang。sitemap 過濾器改讀檔案系統偵測 `.en.md`,自動把
    已翻譯的 `/en/posts/<slug>/` 納入、未翻譯的排除。**驗證**:丟一個暫時
    `deno.en.md` → 英文頁自動升級為正式頁、zh 頁補上 hreflang、進 sitemap;
    移除後回復 fallback(皆已 build 驗證,暫存檔已刪)。
  - **標籤頁 i18n**:`tagPath` / `tagsIndexPath` 加 locale 參數;標籤頁抽共用
    元件 `TagIndex` / `TagPage` 並字典化,新增 `/en/tags/` 與 `/en/tags/[tag]/`
    (互指 hreflang、自我 canonical、`LanguageSwitch`);文章頁與首頁的標籤連結
    改為 locale-aware。
  - 註:內容層(experimental content layer)在**增量** build 有快取,增刪
    `.en.md` 後本機若沒清 `.astro` 快取可能顯示舊狀態;CI 每次全新 checkout
    不受影響,必要時 `rm -rf .astro node_modules/.astro` 再 build。
- ⏳ **Phase 5 收尾**:見下方規劃。實際逐篇英文翻譯(丟 `<slug>.en.md`)可由
  作者日後分批進行,系統會自動接手。

## 一、Astro 的 i18n 生態:和 vue-i18n 的對應關係

vue-i18n 是「執行期翻譯字典 + 格式化」套件。Astro 沒有單一套件完全對應,而是
拆成兩層:

### 1. 官方內建:i18n routing(Astro 4+,7.x 仍支援,已在本專案 astro@7.0.4 驗證)

`astro.config.mjs` 內建 `i18n` 設定,負責 **路由與 URL**,不含翻譯字典:

```js
export default defineConfig({
  i18n: {
    locales: ["zh-hant", "en"],
    defaultLocale: "zh-hant",
    routing: { prefixDefaultLocale: false, fallbackType: "rewrite" },
    fallback: { en: "zh-hant" },
  },
});
```

搭配 `astro:i18n` 虛擬模組的 helper:`getRelativeLocaleUrl()` /
`getAbsoluteLocaleUrl()` / `getPathByLocale()` 等,以及頁面內的
`Astro.currentLocale`。static build(本專案的模式)完全支援。

### 2. UI 字串翻譯(vue-i18n 的核心功能)

| 方案                                              | 定位                                                                          | 適合本專案嗎                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **自建 typed dictionary**(官方文件的 recipe 作法) | `src/i18n/ui.ts` 字典 + `useTranslations(locale)`,零依賴、TypeScript key 檢查 | ✅ 推薦。本專案 UI 字串約 40 餘條,不需要 runtime 套件                                                        |
| **vue-i18n**                                      | 只在 Vue island 內使用(`createI18n` + `useI18n`)                              | ⭕ 可行。本專案 UI 幾乎全在 `BlackHole.vue` island,可直接沿用 vue-i18n 生態;代價是 island bundle +~10KB gzip |
| **Paraglide JS(inlang)**                          | 編譯期產生 message functions,tree-shakable、零 runtime                        | ⭕ 可行,但對這個字串量是殺雞用牛刀                                                                           |
| astro-i18next                                     | i18next 包裝                                                                  | ❌ 已停止維護,不建議新採用                                                                                   |

**結論**:採「內建 i18n routing + 自建 typed dictionary」。同一份字典在
Astro 頁面直接 import,並以 props 傳進 Vue island(island 是
`client:only`,SSR 不會 render,props 傳遞最單純)。若日後需要複數規則、
ICU 格式化,再於 island 內補上 vue-i18n 即可,字典結構可直接沿用。

## 二、現況盤點(需要 i18n 化的範圍)

假設目標:**zh-Hant 為預設語系(URL 不變,不加前綴)+ 新增 en(`/en/` 前綴)**。
URL 不變是刻意的:不破壞既有 SEO 與外部連結。

### 寫死的 UI 字串(約 40+ 條)

- `src/pages/index.astro` — `<html lang>`、`description`、loading 字串
  (「正在點亮星空…」)、`aria-label`(所有文章)、JSON-LD `inLanguage`、
  `og:locale`、og:image alt。
- `src/pages/posts/[slug].astro` — 跳到文章內容、← 返回宇宙、約 N 分鐘、
  標籤、較舊/較新一篇、footer 文案、SEO meta(同上)。
- `src/pages/404.astro`、`src/pages/rss.xml.js` — 標題/描述/`<language>`。
- Vue 元件 — `GlassPanel`(關閉)、`PostListSidebar`(文章清單、搜尋星系…、
  符合 N/M 篇、沒有符合的星星)、`ExitChargePill`、`InfoGuide`(整段操作指南)、
  `ReadingPanel`(關閉文章、單篇頁面 ↗)、`UniverseBreadcrumb`(星系群)、
  `BlackHole.vue`(HintToast 提示、demo 假資料、tooltip meta)。
- 工具函式 — `src/utils/posts.ts` `formatMeta`(約 N 分鐘)、
  `src/utils/galaxies.ts`(第 N 星系)— 需改為吃 locale/t 參數。
- `src/data/posts.ts` `CATEGORY_META` label(現為英文,zh-Hant 顯示也沿用,
  可順手納入字典)。
- `astro.config.mjs` — rehype-autolink-headings 的 `ariaLabel`(build 期單一
  值,兩語系共用或改為符號式 label)。

### 內容(Markdown)

- `src/content/posts/*.md` 共 71 篇,全為 zh-Hant,slug 無語言概念。
- 文章翻譯是**選配**:規劃採 fallback — 沒有英文版的文章,英文站顯示中文
  原文(URL 仍在 `/en/` 下,頁面標注原文語言)。

## 三、遷移步驟

### Phase 1 — 基礎建設(不改任何 UI 行為)

1. `astro.config.mjs` 加入上方 `i18n` 設定。
2. 新增 `src/i18n/`:
   - `config.ts`:`LOCALES`、`DEFAULT_LOCALE`、`Locale` 型別。
   - `ui.ts`:`Record<Locale, Record<UiKey, string>>` 字典,先只填 zh-Hant
     與 en 兩份(en 可先機翻佔位)。
   - `index.ts`:`useTranslations(locale)` 回傳 typed `t(key, ...params)`;
     支援 `{n}` 佔位符即可,不需完整 ICU。
3. 驗證 `pnpm build` 產物與現況 byte-level 等價(defaultLocale 不加前綴,
   所以此階段 URL 零變動)。

### Phase 2 — 抽字串

1. Astro 頁面/`rss.xml.js`:以 `Astro.currentLocale`(或檔案所屬語系)+
   `useTranslations` 取代寫死字串。
2. `utils/posts.ts`、`utils/galaxies.ts` 的顯示字串改為參數注入。
3. Vue island:`index.astro` 把 `locale` 與該語系的 messages 物件以 props 傳入
   `<BlackHole>`;island 內用 `provide/inject` 提供 `t()` 給所有子元件
   (`GlassPanel`、`InfoGuide` 等)。※ 若決定用 vue-i18n,改為在 island 進入點
   `createI18n({ legacy: false, locale, messages })`,子元件用 `useI18n()`。
4. 完成後 zh-Hant 站行為不變,僅字串來源改變。

### Phase 3 — 頁面複製與 SEO

1. 把 `index.astro` / `posts/[slug].astro` 的主體抽成共用元件
   (`src/components/pages/`),頁面檔變薄殼。
2. 新增 `src/pages/en/index.astro`、`src/pages/en/posts/[slug].astro`、
   `src/pages/en/rss.xml.js`、`src/pages/en/404.astro`,傳入 `locale="en"`。
3. SEO 調整(兩語系頁面同步):
   - `<link rel="alternate" hreflang>` 互指(含 `x-default` → zh-Hant)。
   - `og:locale` / JSON-LD `inLanguage` / `<html lang>` 依語系。
   - canonical 各指自己;`@astrojs/sitemap` 開 `i18n` 選項自動產 hreflang。
4. 新增語言切換 UI(header / GlassPanel 內),用 `getRelativeLocaleUrl`
   產生對應連結,**禁止手刻 base 路徑**(維持專案慣例)。

### Phase 4 — 內容翻譯(選配,可獨立排程)

1. 內容集合改為語系子目錄:`src/content/posts/zh-hant/*.md`、
   `src/content/posts/en/*.md`;loader `pattern` 不變,entry id 會自帶
   `zh-hant/`、`en/` 前綴,以此過濾語系。schema 不必加欄位(同名檔案即互為
   翻譯);`postPath` helper 增加 locale 參數。
2. 既有 71 篇移入 `zh-hant/`;`postPath` 去除前綴維持舊 URL 不變。
3. en 站的 `getStaticPaths`:優先取 `en/<slug>`,缺翻譯時 fallback 用
   zh-Hant 內容 + `<html lang="zh-Hant">` 於文章區塊標注,並在頁首顯示
   「此文尚無英文版」提示。
4. RSS/sitemap/JSON-LD 隨語系內容更新。

### Phase 5 — 驗證與收尾

- `pnpm astro check`、`pnpm build`、`pnpm format:check`。
- 驗證:noscript 清單兩語系可用、舊 URL 全數不變(diff sitemap)、
  `/en/` 頁面 hreflang 正確、RSS 兩份都合法。
- 更新 `CLAUDE.md` / `README.md` 的慣例說明(新增字典檔位置、
  「新 UI 字串一律進 `src/i18n/ui.ts`」規範)。

## 四、風險與備註

- **SEO 零風險設計**:defaultLocale 不加前綴 ⇒ 既有 URL、RSS、
  已被索引的頁面完全不動;`/en/` 是純新增。
- **fallback 行為**:static 模式下 `fallbackType: "rewrite"` 會在 `/en/...`
  原地輸出 fallback 內容(不 redirect),符合「缺翻譯顯示原文」的需求;
  但本專案文章頁走自訂 `getStaticPaths`,實際 fallback 在 Phase 4 由
  getStaticPaths 自行處理,config 的 fallback 只涵蓋整頁級路由。
- **Bundle 影響**:自建字典為 0 依賴;僅當引入 vue-i18n 時 island +~10KB gzip。
- **工作量粗估**:Phase 1–2 約一個 PR;Phase 3 一個 PR;Phase 4 依翻譯量
  可長期分批。
