# James Universe — Agent Guide

A 3D "universe" blog built with **Astro (islands) + Vue 3 + Three.js**. Every
Markdown post under `src/content/posts/` becomes one star; zooming out groups
stars into galaxies. Deployed to GitHub Pages. UI language is Traditional
Chinese (`zh-Hant`). See `README.md` for the full tour.

## Stack & tooling

- **Package manager: pnpm** (Node ≥ 22.12). Use `pnpm`, not `npm`/`yarn`.
- Astro 7 + `@astrojs/vue`; the 3D scene is a `client:only="vue"` island.
- Three.js for WebGL, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript strict.
- `@astrojs/sitemap` + `@astrojs/rss` for SEO/feeds; Shiki (`tokyo-night`).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and
`astro dev logs`. Other commands: `pnpm build`, `pnpm preview`,
`pnpm format` / `pnpm format:check` (Prettier), `pnpm astro check` (types).

## How the code is organized

- `src/content/posts/*.md` — **source of truth**; frontmatter schema in
  `src/content.config.ts` (`title`, `date`, `category`, `tags`, `summary`).
  Adding a post needs no code changes.
- `src/data/posts.ts` — `Post` type + `CATEGORY_META` (category → color/label).
- `src/utils/` — dates, reading time (`posts.ts`), galaxy chunking
  (`galaxies.ts`), category helpers (`categories.ts`).
- `src/components/` — Vue UI + 3D island; `BlackHole.vue` is the orchestrator.
- `src/three/blackhole/` — pure Three.js scene modules (starfield, accretion
  disk, jets, lensing shader, etc.).
- `src/pages/` — `index.astro` (3D + `<noscript>` fallback),
  `posts/[slug].astro` (static, indexable per-post pages), `rss.xml.js`, `404`.

## Conventions

- Keep a static, JS-free, indexable path for content: the `[slug]` pages and
  the index's `<noscript>` list must stay usable. Preserve SEO metadata
  (canonical, OG, JSON-LD) when touching `<head>`.
- `astro.config.mjs` sets `site`/`base` (`/astro-blog`) — build site-relative
  URLs with the `postPath` / `BASE_URL` helpers, never hardcode the base.
- Deploy is automatic on push to `main` via `.github/workflows/deploy.yml`.
- **UI strings live in `src/i18n/ui.ts`**, keyed per locale (`zh-hant` is the
  source of truth). Never hardcode user-facing text — add a `UiKey` and use
  `useTranslations(locale)` in Astro pages, or `useI18n()` inside the Vue
  island (`<BlackHole>` provides one locale-bound `t` to all children).
  `astro.config.mjs`'s `i18n` block owns routing; `zh-hant` is prefix-less so
  existing URLs never move. Migration plan: `docs/i18n-migration-plan.md`.

## Pull Request 標題規範

PR 標題一律採用 `<type>: [Scope] - <描述>` 格式：

- **type**：Conventional Commits 類型 — `feat`（新功能）、`fix`（修錯）、
  `refactor`、`style`、`docs`、`chore`、`perf`、`test`。
- **[Scope]**：受影響的元件 / 模組 / 區塊，首字母大寫，用中括號包起來。
  例如 `[Base]`（專案設定 / 建置）、`[BlackHole]`、`[GlassPanel]`、
  `[ContentStars]`、`[RSS]`。
- **描述**：以繁體中文（`zh-Hant`）簡述變更；牽涉特定檔案時可點名該檔。

範例：

- `feat: [Base] - vite.config.ts 設定 xxx 調整`
- `fix: [GlassPanel] - 玻璃效果調整`

## Documentation

Full Astro docs: <https://docs.astro.build>. Useful guides:

- [Routing / pages / middleware](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework (Vue/React/…) components](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling / Tailwind](https://docs.astro.build/en/guides/styling/)
