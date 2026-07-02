import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The `posts` collection is the source of truth for the universe: every
 * Markdown file under `src/content/posts/` becomes one star. Drop in a new
 * `.md` with this frontmatter and a new star appears automatically.
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.string(), // display date, e.g. "2025.04"
    category: z.enum(["project", "frontend", "philosophy", "blog", "demo"]),
    tags: z.array(z.string()),
    summary: z.string(),
  }),
});

export const collections = { posts };
