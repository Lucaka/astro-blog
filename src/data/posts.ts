/**
 * Placeholder content for the "each star is a post" universe.
 *
 * The shape here deliberately mirrors what a Markdown frontmatter block will
 * provide later, so swapping this array for an Astro content collection
 * (`getCollection("posts")`) is a drop-in change: keep these same fields in
 * each `.md` file's frontmatter and map the collection entries to `Post`.
 * Nothing here describes 3D placement — orbit radius/angle/speed are derived
 * from the post index in `contentStars.ts`, keeping content and presentation
 * separate.
 */
export type PostCategory =
  | "project"
  | "frontend"
  | "philosophy"
  | "blog"
  | "demo";

export interface Post {
  /** URL-safe id; will become the Markdown file slug. */
  slug: string;
  title: string;
  /** Display date, e.g. "2025.04". */
  date: string;
  category: PostCategory;
  tags: string[];
  /** One-line summary shown on hover and atop the reading panel. */
  summary: string;
  /** Body copy; will later be rendered Markdown. */
  body: string;
}

/** Per-category presentation: the star tint and its human-readable label. */
export const CATEGORY_META: Record<
  PostCategory,
  { label: string; color: number }
> = {
  project: { label: "Project", color: 0xffd54a },
  frontend: { label: "Frontend", color: 0x6fb3ff },
  philosophy: { label: "Philosophy", color: 0xb07cff },
  blog: { label: "Blog", color: 0xf0f0f0 },
  demo: { label: "Demo", color: 0x5fe6d0 },
};

export const posts: Post[] = [
  {
    slug: "frontend-architecture",
    title: "Frontend Architecture",
    date: "2025.04",
    category: "frontend",
    tags: ["Vue", "TypeScript", "Performance"],
    summary: "如何在大型專案中設計可維護、可測試的前端架構。",
    body: "從元件邊界、狀態管理到渲染效能，一套讓團隊長期維護的前端架構原則。這裡先放假內容，之後會換成 Markdown。",
  },
  {
    slug: "webgl-black-hole",
    title: "Rendering a Black Hole",
    date: "2025.03",
    category: "demo",
    tags: ["Three.js", "GLSL", "WebGL"],
    summary: "用 Three.js 打造吸積盤、光子環與重力透鏡的即時渲染。",
    body: "拆解吸積盤粒子系統、螢幕空間重力透鏡與光子環的實作細節，以及如何在維持 60fps 下堆疊這些效果。",
  },
  {
    slug: "the-shape-of-time",
    title: "The Shape of Time",
    date: "2025.02",
    category: "philosophy",
    tags: ["Thinking", "Essay"],
    summary: "關於時間、記憶與敘事結構的一段思考。",
    body: "我們如何用空間隱喻理解時間？一篇關於感知與敘事的隨筆。",
  },
  {
    slug: "island-architecture-notes",
    title: "Islands & Partial Hydration",
    date: "2025.01",
    category: "blog",
    tags: ["Astro", "Performance"],
    summary: "Astro 的 island 架構如何在預設零 JS 下做互動。",
    body: "說明 partial hydration 的取捨，以及何時該把一塊 UI 變成 island。",
  },
  {
    slug: "universe-blog",
    title: "James Universe Blog",
    date: "2025.05",
    category: "project",
    tags: ["Design", "Astro", "Three.js"],
    summary: "以宇宙為主題、星星即內容的個人部落格。",
    body: "把整個網站變成一片可探索的宇宙，每顆星星都是一篇文章或作品的入口。",
  },
  {
    slug: "shader-notes",
    title: "Shader Field Notes",
    date: "2024.12",
    category: "demo",
    tags: ["GLSL", "Graphics"],
    summary: "累積的一些片段著色器技巧與筆記。",
    body: "從 SDF、噪聲到後製，收集實作過程中反覆用到的 shader 片段。",
  },
  {
    slug: "type-safe-apis",
    title: "Type-Safe APIs",
    date: "2024.11",
    category: "frontend",
    tags: ["TypeScript", "DX"],
    summary: "用型別把 API 契約鎖在編譯期。",
    body: "從 schema 到端到端型別推導，減少前後端契約漂移的做法。",
  },
  {
    slug: "on-simplicity",
    title: "On Simplicity",
    date: "2024.10",
    category: "philosophy",
    tags: ["Design", "Essay"],
    summary: "簡單不是少，而是剛好。",
    body: "為什麼「極簡」是一種持續的取捨，而不是一次性的減法。",
  },
];
