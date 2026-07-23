// @ts-check
import { readdirSync } from "node:fs";
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";
import sitemap from "@astrojs/sitemap";

// Slugs that have an English translation (`<slug>.en.md`). A translated
// `/en/posts/<slug>/` is a real, self-canonical URL and belongs in the
// sitemap; an untranslated one is a fallback canonical'd back to the original,
// so it's filtered out. Reading the dir here keeps this in sync automatically —
// drop in a translation and its English page joins the sitemap on next build.
const translatedEnSlugs = new Set(
  readdirSync("./src/content/posts", { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".en.md"))
    .map((e) => e.name.slice(0, -".en.md".length)),
);
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import remarkCallouts from "./src/plugins/remark-callouts.mjs";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";

// https://astro.build/config
export default defineConfig({
  site: "https://www.6ka.dev/",
  base: "/",
  // i18n routing. `zh-hant` is the default locale and carries NO URL prefix,
  // so every existing page, feed and indexed link stays exactly where it is;
  // `en` (served under `/en/`) is additive. Translated UI strings live in
  // `src/i18n/`, not here — this block only governs routing.
  i18n: {
    locales: ["zh-hant", "en"],
    defaultLocale: "zh-hant",
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    // Expressive Code renders every fenced code block: syntax highlighting
    // (same tokyo-night palette as before), plus a copy button and titles.
    // It detects the `unified` processor below and injects itself into it.
    expressiveCode({
      themes: ["tokyo-night"],
      styleOverrides: {
        borderRadius: "12px",
        borderColor: "rgba(255, 255, 255, 0.08)",
        codeFontSize: "14px",
        frames: {
          // Blend the code frame into the dark universe backdrop.
          editorBackground: "rgba(255, 255, 255, 0.02)",
          terminalBackground: "rgba(255, 255, 255, 0.02)",
        },
      },
    }),
    vue(),
    // Keep the sitemap to canonical URLs only. An `/en/posts/<slug>/` page is
    // an untranslated fallback (canonical'd to the original) UNLESS a
    // translation exists — then it's a real URL and stays in. Everything else,
    // including `/en/` and `/en/tags/` (real localized alternates), stays in.
    sitemap({
      filter: (page) => {
        const match = page.match(/\/en\/posts\/([^/]+)\//);
        return match ? translatedEnSlugs.has(match[1]) : true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Astro 7's default (Sätteri) processor doesn't take remark/rehype plugins
    // directly, so we opt into the `unified` processor to run ours. Keep GFM +
    // smart punctuation on to match the previous default rendering.
    processor: unified({
      gfm: true,
      smartypants: true,
      // remarkDirective parses `:::info` / `:::warning`; remarkCallouts turns
      // those into styled <aside> callouts. Order matters (parse, then transform).
      remarkPlugins: [remarkDirective, remarkCallouts],
      rehypePlugins: [
        // Give every heading an id, then append a clickable `#` anchor to it.
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: {
              className: ["heading-anchor"],
              ariaLabel: "此標題的錨點連結",
            },
            content: { type: "text", value: "#" },
          },
        ],
        // Open external links in a new tab, safely.
        [
          rehypeExternalLinks,
          { target: "_blank", rel: ["noopener", "noreferrer"] },
        ],
      ],
    }),
    // Code highlighting is handled by Expressive Code (above), not Shiki.
  },
});
