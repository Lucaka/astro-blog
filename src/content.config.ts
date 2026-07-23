import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The `posts` collection is the source of truth for the universe: every
 * base-language (zh-hant) Markdown file under `src/content/posts/` becomes one
 * star. Drop in a new `.md` with this frontmatter and a new star appears
 * automatically.
 *
 * Translations live beside the original as `<slug>.<locale>.md` sibling files
 * (e.g. `pnpm.en.md`), loaded by the separate `postTranslations` collection —
 * so they never leak into the star list, the index, the feed or the tag pages,
 * which all read `posts`.
 */
const posts = defineCollection({
  // Exclude locale-suffixed translations (`*.en.md`, …) from the base list.
  loader: glob({
    pattern: ["**/*.md", "!**/*.en.md"],
    base: "./src/content/posts",
  }),
  schema: z.object({
    title: z.string(),
    date: z.string(), // display date, e.g. "2025.04"
    category: z.enum(["project", "frontend", "philosophy", "blog", "demo"]),
    tags: z.array(z.string()),
    summary: z.string(),
  }),
});

/**
 * Per-post translations. A file `pnpm.en.md` is the English rendering of the
 * `pnpm` post; its entry id is `pnpm.en`. Only the language-specific fields are
 * needed — `date`, `category` and `tags` are inherited from the original at
 * render time, so a translation never drifts from its source on those.
 */
const postTranslations = defineCollection({
  // Keep the raw `<slug>.<locale>` id (the default slugifier would strip the
  // dot, turning `pnpm.en` into `pnpmen`), so translations resolve by
  // `${baseId}.${locale}`.
  loader: glob({
    pattern: "**/*.en.md",
    base: "./src/content/posts",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

export const collections = { posts, postTranslations };
