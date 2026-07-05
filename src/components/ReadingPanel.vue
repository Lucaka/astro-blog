<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { Post } from "../data/posts";
import { catColor, catLabel } from "../utils/categories";
import { postMeta, postPath } from "../utils/posts";

// Reading panel: glassmorphism card shown when a post is open. The parent
// owns which post is open (its state lives in the URL via pushState), so
// closing only emits — history handling stays with the deep-link logic.
const props = defineProps<{
  post: Post | null;
  /** Server-rendered Markdown body, read from the hidden node by slug. */
  html: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// --- Modal accessibility: focus management + trap + Esc --------------------
const panelEl = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;
watch(
  () => props.post,
  async (post) => {
    if (post) {
      lastFocused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await nextTick();
      panelEl.value?.focus();
    } else if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  },
);

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !panelEl.value) return;
  const focusables = panelEl.value.querySelectorAll<HTMLElement>(
    'button, a[href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panelEl.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Transition name="panel-fade">
    <div
      v-if="post"
      class="reading-scrim"
      @click.self="emit('close')"
      @keydown="handlePanelKeydown"
    >
      <article
        ref="panelEl"
        class="reading-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="post.title"
        tabindex="-1"
      >
        <button
          class="reading-panel__close"
          aria-label="關閉文章"
          @click="emit('close')"
        >
          ×
        </button>
        <div
          class="reading-panel__category"
          :style="{ color: catColor(post.category) }"
        >
          <span
            class="reading-panel__dot"
            :style="{ background: catColor(post.category) }"
          ></span>
          {{ catLabel(post.category) }}
        </div>
        <h2 class="reading-panel__title">{{ post.title }}</h2>
        <div class="reading-panel__meta">
          {{ postMeta(post) }} ·
          <a class="reading-panel__permalink" :href="postPath(post.slug)"
            >單篇頁面 ↗</a
          >
        </div>
        <div class="reading-panel__tags">
          <span v-for="tag in post.tags" :key="tag" class="reading-panel__tag">{{
            tag
          }}</span>
        </div>
        <p class="reading-panel__summary">{{ post.summary }}</p>
        <!-- Rendered Markdown from the content collection. -->
        <div class="reading-panel__body" v-html="html"></div>
      </article>
    </div>
  </Transition>
</template>

<style scoped>
.reading-scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: clamp(16px, 4vw, 48px);
}
.reading-panel {
  position: relative;
  width: min(440px, 92vw);
  max-height: 84vh;
  overflow-y: auto;
  padding: 32px 30px;
  border-radius: 20px;
  background: rgba(14, 18, 30, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  color: #eef2ff;
}
.reading-panel:focus {
  outline: none;
}
.reading-panel__close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #cdd6f4;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.reading-panel__close:hover,
.reading-panel__close:focus-visible {
  background: rgba(255, 255, 255, 0.14);
}
.reading-panel__category {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.reading-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.reading-panel__title {
  margin: 12px 0 6px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}
.reading-panel__meta {
  font-size: 13px;
  opacity: 0.75;
}
.reading-panel__permalink {
  color: #8ab4ff;
  text-decoration: none;
}
.reading-panel__permalink:hover,
.reading-panel__permalink:focus-visible {
  text-decoration: underline;
}
.reading-panel__tags {
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.reading-panel__tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.reading-panel__summary {
  margin: 8px 0 16px;
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.92;
}
.reading-panel__body {
  font-size: 14px;
  line-height: 1.75;
  opacity: 0.78;
}
/* Rendered Markdown (v-html) is unscoped, so reach it with :deep(). */
.reading-panel__body :deep(p) {
  margin: 0 0 12px;
}
.reading-panel__body :deep(strong) {
  color: #fff;
  font-weight: 600;
}
.reading-panel__body :deep(ul),
.reading-panel__body :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
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
}
.reading-panel__body :deep(code) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
}
.reading-panel__body :deep(pre) {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
.reading-panel__body :deep(pre code) {
  padding: 0;
  background: none;
  font-size: inherit;
}

/* Panel fade/slide transition (slow, per the calm-motion goal). */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.35s ease;
}
.panel-fade-enter-active .reading-panel,
.panel-fade-leave-active .reading-panel {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
.panel-fade-enter-from .reading-panel,
.panel-fade-leave-to .reading-panel {
  transform: translateX(24px);
  opacity: 0;
}

/* Reduced motion: keep the UI transitions near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .panel-fade-enter-active,
  .panel-fade-leave-active,
  .panel-fade-enter-active .reading-panel,
  .panel-fade-leave-active .reading-panel {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}

/* Mobile: the reading panel becomes a full-screen sheet. */
@media (max-width: 640px) {
  .reading-scrim {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  .reading-panel {
    width: 100vw;
    max-height: none;
    height: 100dvh;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-sizing: border-box;
    padding: 28px 22px 40px;
    /* More opaque than the desktop card: full-screen text sits directly over
       the bright bloom ring, so readability wins over the glass effect. */
    background: rgba(10, 13, 22, 0.72);
  }
  .panel-fade-enter-from .reading-panel,
  .panel-fade-leave-to .reading-panel {
    transform: translateY(24px);
  }
}
</style>
