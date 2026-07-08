// @ts-check
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";
import remarkDirective from "remark-directive";
import remarkCallouts from "./src/plugins/remark-callouts.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://Lucaka.github.io",
  base: "/astro-blog",
  integrations: [
    // Expressive Code renders every fenced code block: syntax highlighting
    // (same tokyo-night palette as before), plus a copy button and titles.
    // Must be listed before other integrations that touch Markdown.
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
    // remarkDirective parses `:::info` / `:::warning`; remarkCallouts turns
    // those into styled <aside> callouts. Order matters (parse, then transform).
    remarkPlugins: [remarkDirective, remarkCallouts],
    // Code highlighting is handled by Expressive Code (above), not Shiki.
  },
});
