<script setup lang="ts">
import type { Post } from "../data/posts";
import { catColor, catLabel } from "../utils/categories";
import { postMeta, postPath } from "../utils/posts";
import { useI18n, useLocale } from "../i18n/vue";
import GlassPanel from "./GlassPanel.vue";

const t = useI18n();
const locale = useLocale();

// Reading panel: glassmorphism card shown when a post is open. The parent
// owns which post is open (its state lives in the URL via pushState), so
// closing only emits — history handling stays with the deep-link logic. The
// scrim, card chrome, close button and modal a11y live in <GlassPanel>; this
// component only supplies the article content.
defineProps<{
  post: Post | null;
  /** Server-rendered Markdown body, read from the hidden node by slug. */
  html: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <GlassPanel
    :open="!!post"
    :label="post?.title ?? ''"
    align="end"
    tag="article"
    :close-label="t('reading.close')"
    solid
    @close="emit('close')"
  >
    <template v-if="post">
      <div
        class="inline-flex items-center gap-xs text-sm font-semibold tracking-label uppercase"
        :style="{ color: catColor(post.category) }"
      >
        <span
          class="size-2 rounded-full"
          :style="{ background: catColor(post.category) }"
        ></span>
        {{ catLabel(post.category) }}
      </div>
      <h2 class="mt-3 mb-1.5 leading-[1.2] font-bold text-balance text-panel">
        {{ post.title }}
      </h2>
      <div class="text-reading text-ink-meta">
        {{ postMeta(post, t) }} ·
        <a
          class="text-accent underline decoration-1 underline-offset-[3px] hover:text-accent-strong"
          :href="postPath(post.slug, locale)"
          >{{ t("reading.fullPage") }}</a
        >
      </div>
      <div class="my-4 flex flex-wrap gap-xs">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-lg border border-line bg-fill px-2.5 py-1 text-sm text-ink-soft"
          >{{ tag }}</span
        >
      </div>
      <p class="mt-2 mb-4 text-reading leading-[1.6] text-ink-body">
        {{ post.summary }}
      </p>
      <!-- Rendered Markdown from the content collection. Styles live in global `.prose`. -->
      <div class="reading-panel__body prose prose--compact" v-html="html"></div>
    </template>
  </GlassPanel>
</template>
