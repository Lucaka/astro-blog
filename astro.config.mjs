// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://Lucaka.github.io',
  base: '/astro-blog',
  integrations: [vue(), sitemap()],
  markdown: {
    shikiConfig: {
      // Deep blue/purple theme so highlighted code sits naturally on the
      // dark universe backdrop (both in the reading panel and post pages).
      theme: 'tokyo-night',
    },
  },
});
