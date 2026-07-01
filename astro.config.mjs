// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  site: 'https://Lucaka.github.io',
  base: '/astro-blog',
  integrations: [vue()],
});