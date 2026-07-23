/**
 * The UI string dictionary — every piece of chrome the site renders, keyed by
 * a dotted string and translated per locale. `zh-hant` is the source of truth:
 * its key set defines `UiKey`, so a missing `en` entry is a type error.
 *
 * Values may contain `{name}` placeholders, filled in by `useTranslations`
 * (see `index.ts`). A handful of keys (the `guide.item*` list) carry inline
 * `<strong>` markup and are rendered with `v-html`; they hold only trusted,
 * static text, never user input.
 */
import type { Locale } from "./config";

export const UI = {
  "zh-hant": {
    // Shared / brand
    "site.name": "James Universe",
    "site.description":
      "James Universe — 在 3D 宇宙裡探索的部落格:前端、圖學與隨筆。每顆星星都是一篇文章。",
    "og.imageAlt": "James Universe — 3D 宇宙部落格的黑洞星空",
    "footer.tagline": "在宇宙裡探索所有文章",

    // Index page
    "index.docTitle": "James Universe — 前端、圖學與隨筆的 3D 宇宙部落格",
    "index.postsNavLabel": "所有文章",
    "index.loadingSub": "正在點亮星空…",

    // Tags
    "tags.browseAll": "瀏覽所有標籤",
    "tags.browse": "瀏覽標籤",
    "tags.allTitle": "所有標籤",
    "tags.indexDescription":
      "James Universe 的所有文章標籤,共 {count} 個主題。",
    "tags.indexSub": "{count} 個主題 · 點一個標籤看相關文章",
    "tags.eyebrow": "標籤",
    "tags.skipToList": "跳到文章清單",
    "tags.postCount": "共 {count} 篇文章",
    "tags.pageLabel": "標籤:{tag}",
    "tags.pageDescription":
      "所有標記「{tag}」的文章,共 {count} 篇 — James Universe。",

    // 404 page
    "notFound.docTitle": "404 — James Universe",
    "notFound.title": "這顆星星不在這片宇宙裡",
    "notFound.text": "可能是連結打錯了，或這篇文章已經飄向了別的星系。",
    "notFound.backHome": "← 返回宇宙",
    "notFound.postsHeading": "或者，看看這些星星",

    // Post page ([slug])
    "post.docTitleSuffix": "— James Universe",
    "post.skip": "跳到文章內容",
    "post.back": "← 返回宇宙",
    "post.rss": "RSS",
    "post.readingTime": "約 {minutes} 分鐘",
    "post.tagsLabel": "標籤",
    "post.navLabel": "前後篇文章",
    "post.older": "← 較舊一篇",
    "post.newer": "較新一篇 →",
    "post.untranslatedNotice": "本文尚無此語言版本，以下顯示原文。",

    // Language switcher
    "nav.language": "語言",

    // RSS feed
    "rss.description": "在宇宙裡探索的部落格：前端、圖學與隨筆。",

    // Galaxies
    "galaxy.name": "第 {n} 星系",
    "galaxy.postCount": "{count} 篇文章",
    "galaxy.starCount": "{count} 顆星",
    "galaxy.current": "（目前）",

    // In-scene hints
    "hint.explore": "拖曳探索宇宙 · 點擊星星閱讀文章",
    "hint.group": "點擊星系進入 · 滾輪放大返回",

    // ?demo synthetic posts
    "demo.title": "演示文章 {n}",
    "demo.summary": "?demo 模式的假資料，用來測試多星系視角。",

    // Breadcrumb
    "breadcrumb.navLabel": "宇宙層級",
    "breadcrumb.group": "星系群",

    // Article list sidebar
    "sidebar.toggle": "文章清單",
    "sidebar.panelLabel": "文章清單",
    "sidebar.searchPlaceholder": "搜尋星系…",
    "sidebar.searchLabel": "搜尋文章",
    "sidebar.matchCount": "符合 {matched} / {total} 篇",
    "sidebar.totalCount": "共 {total} 篇",
    "sidebar.noResults": "沒有符合的星星",

    // Overscroll-to-exit pill
    "exit.label": "繼續縮小 → 前往星系群",

    // Info guide
    "guide.button": "操作指南",
    "guide.title": "操作指南",
    "guide.close": "關閉操作指南",
    "guide.item1":
      "<strong>拖曳</strong>旋轉視角，<strong>滾輪 / 雙指</strong>縮放",
    "guide.item2": "<strong>點擊星星</strong>閱讀文章，游標懸停可預覽",
    "guide.item3": "<strong>左下圖例</strong>篩選分類",
    "guide.item4":
      "左上<strong>文章清單</strong>可瀏覽並<strong>搜尋</strong>全部文章，懸停點亮對應的星星，點擊即飛往該星並開啟文章",
    "guide.item5":
      "<strong>縮小到底後持續縮小</strong>離開星系、綜覽星系群；點擊星系或放大即可返回",
    "guide.item6": "左上<strong>星系群</strong>麵包屑隨時可切換視角",

    // Reading panel
    "reading.close": "關閉文章",
    "reading.fullPage": "單篇頁面 ↗",

    // Glass panel (shared modal shell)
    "panel.close": "關閉",
  },

  en: {
    // Shared / brand
    "site.name": "James Universe",
    "site.description":
      "James Universe — a blog you explore inside a 3D universe: front-end, graphics and essays. Every star is an article.",
    "og.imageAlt":
      "James Universe — the black-hole starfield of a 3D universe blog",
    "footer.tagline": "explore every article across the universe",

    // Index page
    "index.docTitle":
      "James Universe — a 3D universe blog on front-end, graphics & essays",
    "index.postsNavLabel": "All articles",
    "index.loadingSub": "Lighting up the stars…",

    // Tags
    "tags.browseAll": "Browse all tags",
    "tags.browse": "Browse tags",
    "tags.allTitle": "All tags",
    "tags.indexDescription":
      "All article tags on James Universe — {count} topics.",
    "tags.indexSub": "{count} topics · pick a tag to see related articles",
    "tags.eyebrow": "Tags",
    "tags.skipToList": "Skip to the article list",
    "tags.postCount": "{count} articles",
    "tags.pageLabel": "Tag: {tag}",
    "tags.pageDescription":
      "All articles tagged “{tag}” — {count} in total, on James Universe.",

    // 404 page
    "notFound.docTitle": "404 — James Universe",
    "notFound.title": "This star isn't in this universe",
    "notFound.text":
      "The link may be wrong, or this article has drifted off to another galaxy.",
    "notFound.backHome": "← Back to the universe",
    "notFound.postsHeading": "Or take a look at these stars",

    // Post page ([slug])
    "post.docTitleSuffix": "— James Universe",
    "post.skip": "Skip to article content",
    "post.back": "← Back to the universe",
    "post.rss": "RSS",
    "post.readingTime": "~{minutes} min read",
    "post.tagsLabel": "Tags",
    "post.navLabel": "Previous and next articles",
    "post.older": "← Older",
    "post.newer": "Newer →",
    "post.untranslatedNotice":
      "This article isn't available in this language yet — showing the original below.",

    // Language switcher
    "nav.language": "Language",

    // RSS feed
    "rss.description":
      "A blog you explore inside the universe: front-end, graphics and essays.",

    // Galaxies
    "galaxy.name": "Galaxy {n}",
    "galaxy.postCount": "{count} articles",
    "galaxy.starCount": "{count} stars",
    "galaxy.current": " (current)",

    // In-scene hints
    "hint.explore": "Drag to explore · Click a star to read",
    "hint.group": "Click a galaxy to enter · Zoom in to return",

    // ?demo synthetic posts
    "demo.title": "Demo article {n}",
    "demo.summary":
      "Fake data for ?demo mode, used to test the multi-galaxy view.",

    // Breadcrumb
    "breadcrumb.navLabel": "Universe hierarchy",
    "breadcrumb.group": "Galaxy group",

    // Article list sidebar
    "sidebar.toggle": "Articles",
    "sidebar.panelLabel": "Article list",
    "sidebar.searchPlaceholder": "Search the galaxy…",
    "sidebar.searchLabel": "Search articles",
    "sidebar.matchCount": "{matched} / {total} matches",
    "sidebar.totalCount": "{total} articles",
    "sidebar.noResults": "No matching stars",

    // Overscroll-to-exit pill
    "exit.label": "Keep zooming out → to the galaxy group",

    // Info guide
    "guide.button": "Guide",
    "guide.title": "Guide",
    "guide.close": "Close the guide",
    "guide.item1":
      "<strong>Drag</strong> to rotate the view, <strong>scroll / pinch</strong> to zoom",
    "guide.item2": "<strong>Click a star</strong> to read; hover to preview",
    "guide.item3": "<strong>Legend (bottom-left)</strong> filters by category",
    "guide.item4":
      "The <strong>article list</strong> (top-left) browses and <strong>searches</strong> every article; hover to light up its star, click to fly there and open it",
    "guide.item5":
      "<strong>Keep zooming out past the limit</strong> to leave the galaxy and survey the group; click a galaxy or zoom in to return",
    "guide.item6":
      "The <strong>galaxy group</strong> breadcrumb (top-left) switches views anytime",

    // Reading panel
    "reading.close": "Close article",
    "reading.fullPage": "Full page ↗",

    // Glass panel (shared modal shell)
    "panel.close": "Close",
  },
} as const satisfies Record<Locale, Record<string, string>>;

/** Every translatable key, derived from the source (default) locale. */
export type UiKey = keyof (typeof UI)["zh-hant"];
