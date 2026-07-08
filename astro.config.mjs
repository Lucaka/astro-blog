// @ts-check
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";
import sitemap from "@astrojs/sitemap";
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
  site: "https://Lucaka.github.io",
  base: "/astro-blog",
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
    sitemap(),
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
