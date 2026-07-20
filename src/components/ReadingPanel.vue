<script setup lang="ts">
import type { Post } from "../data/posts";
import { catColor, catLabel } from "../utils/categories";
import { postMeta, postPath } from "../utils/posts";
import { useI18n } from "../i18n/vue";
import GlassPanel from "./GlassPanel.vue";

const t = useI18n();

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
    @close="emit('close')"
  >
    <template v-if="post">
      <div
        class="inline-flex items-center gap-[7px] text-xs font-semibold tracking-[0.04em] uppercase"
        :style="{ color: catColor(post.category) }"
      >
        <span
          class="size-2 rounded-full"
          :style="{ background: catColor(post.category) }"
        ></span>
        {{ catLabel(post.category) }}
      </div>
      <h2 class="mt-3 mb-1.5 text-[26px] leading-[1.2] font-bold">
        {{ post.title }}
      </h2>
      <div class="text-[13px] opacity-75">
        {{ postMeta(post, t) }} ·
        <a
          class="text-accent hover:underline focus-visible:underline"
          :href="postPath(post.slug)"
          >{{ t("reading.fullPage") }}</a
        >
      </div>
      <div class="my-4 flex flex-wrap gap-[7px]">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-lg border border-white/8 bg-white/7 px-2.5 py-[3px] text-xs"
          >{{ tag }}</span
        >
      </div>
      <p class="mt-2 mb-4 text-[15px] leading-[1.6] opacity-[0.92]">
        {{ post.summary }}
      </p>
      <!-- Rendered Markdown from the content collection. -->
      <div
        class="reading-panel__body text-sm leading-[1.75] opacity-[0.78]"
        v-html="html"
      ></div>
    </template>
  </GlassPanel>
</template>

<style scoped>
/* Rendered Markdown (v-html) is unscoped raw HTML — Tailwind classes can't
   reach it, so it keeps a hand-written block via :deep(). The list-style /
   underline / heading rules restore what Tailwind's preflight resets. */
.reading-panel__body :deep(p) {
  margin: 0 0 12px;
}
.reading-panel__body :deep(strong) {
  color: #fff;
  font-weight: 600;
}
.reading-panel__body :deep(h2),
.reading-panel__body :deep(h3) {
  margin: 24px 0 10px;
  line-height: 1.3;
  color: #fff;
  font-weight: 600;
}
.reading-panel__body :deep(h2) {
  font-size: 18px;
}
.reading-panel__body :deep(h3) {
  font-size: 16px;
}
.reading-panel__body :deep(ul),
.reading-panel__body :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
}
.reading-panel__body :deep(ul) {
  list-style: disc;
}
.reading-panel__body :deep(ol) {
  list-style: decimal;
}
.reading-panel__body :deep(li) {
  margin: 4px 0;
}
.reading-panel__body :deep(blockquote) {
  margin: 12px 0;
  padding: 6px 14px;
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  opacity: 0.8;
  font-style: italic;
}
.reading-panel__body :deep(a) {
  color: #8ab4ff;
  text-decoration: underline;
}
/* Heading anchors are for the standalone article page; the modal has no
   scroll-to-hash affordance, so drop them here to keep headings clean. */
.reading-panel__body :deep(.heading-anchor) {
  display: none;
}
.reading-panel__body :deep(code) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
}
/* Fenced code is rendered by Expressive Code (own frame + copy button); just
   space it and stop the inline-code pill from leaking onto its lines. */
.reading-panel__body :deep(.expressive-code) {
  margin: 0 0 12px;
}
.reading-panel__body :deep(.expressive-code code) {
  padding: 0;
  background: none;
  border-radius: 0;
  font-size: inherit;
}

/* Callouts: :::info / :::warning turned into <aside> by remark-callouts. */
.reading-panel__body :deep(.callout) {
  margin: 14px 0;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left-width: 3px;
  background: rgba(255, 255, 255, 0.04);
}
.reading-panel__body :deep(.callout > :last-child) {
  margin-bottom: 0;
}
.reading-panel__body :deep(.callout__label) {
  margin: 0 0 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.9;
}
.reading-panel__body :deep(.callout--info) {
  border-left-color: #8ab4ff;
}
.reading-panel__body :deep(.callout--info .callout__label) {
  color: #8ab4ff;
}
.reading-panel__body :deep(.callout--warning) {
  border-left-color: #ffcc66;
  background: rgba(255, 204, 102, 0.06);
}
.reading-panel__body :deep(.callout--warning .callout__label) {
  color: #ffcc66;
}
</style>
