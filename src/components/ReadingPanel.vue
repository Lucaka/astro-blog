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
      class="fixed inset-0 z-30 flex items-center justify-end p-[clamp(16px,4vw,48px)] max-sm:items-stretch max-sm:justify-stretch max-sm:p-0"
      @click.self="emit('close')"
      @keydown="handlePanelKeydown"
    >
      <!-- Mobile (max-sm): a full-screen sheet, more opaque than the desktop
           card — full-screen text sits directly over the bright bloom ring,
           so readability wins over the glass effect. -->
      <article
        ref="panelEl"
        class="reading-panel relative max-h-[84vh] w-[min(440px,92vw)] overflow-y-auto rounded-[20px] border border-white/12 bg-[#0e121e]/45 px-[30px] py-8 text-ink shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-lg focus:outline-none max-sm:h-dvh max-sm:max-h-none max-sm:w-screen max-sm:rounded-none max-sm:border-x-0 max-sm:bg-[#0a0d16]/72 max-sm:px-[22px] max-sm:pt-7 max-sm:pb-10"
        role="dialog"
        aria-modal="true"
        :aria-label="post.title"
        tabindex="-1"
      >
        <button
          class="absolute top-3.5 right-4 size-8 cursor-pointer rounded-lg bg-white/6 text-xl leading-none text-[#cdd6f4] transition-colors duration-150 hover:bg-white/14 focus-visible:bg-white/14"
          aria-label="關閉文章"
          @click="emit('close')"
        >
          ×
        </button>
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
          {{ postMeta(post) }} ·
          <a
            class="text-accent hover:underline focus-visible:underline"
            :href="postPath(post.slug)"
            >單篇頁面 ↗</a
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
      </article>
    </div>
  </Transition>
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

/* Panel fade/slide transition (slow, per the calm-motion goal). Vue
   <Transition> hooks are runtime-generated class names, so they stay as CSS
   rather than Tailwind utilities. */
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

/* Mobile: the sheet slides up from below instead of in from the right. */
@media (max-width: 640px) {
  .panel-fade-enter-from .reading-panel,
  .panel-fade-leave-to .reading-panel {
    transform: translateY(24px);
  }
}
</style>
