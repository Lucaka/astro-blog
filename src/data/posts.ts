/**
 * Post types and per-category presentation.
 *
 * The actual content now lives as Markdown under `src/content/posts/` (the
 * `posts` content collection). `index.astro` loads that collection, passes
 * this metadata into the <BlackHole> island as a prop, and server-renders
 * each body into a hidden node that the reading panel reads by slug — so this
 * file no longer holds any content, only the shared type and the category →
 * color/label mapping.
 */
export type PostCategory =
  | "project"
  | "frontend"
  | "philosophy"
  | "blog"
  | "demo";

export interface Post {
  /** Content collection entry id / Markdown file slug. */
  slug: string;
  title: string;
  /** Display date, e.g. "2025.04". */
  date: string;
  category: PostCategory;
  tags: string[];
  /** One-line summary shown on hover and atop the reading panel. */
  summary: string;
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
