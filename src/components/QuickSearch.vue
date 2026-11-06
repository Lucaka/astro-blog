<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { Post, PostCategory } from "../data/posts";
import { catColor, catLabel } from "../utils/categories";
import { useI18n } from "../i18n/vue";

const props = defineProps<{
  posts: Post[];
  /** Hide the HUD trigger while a reading panel covers the scene. */
  hidden: boolean;
}>();

const emit = defineEmits<{
  (e: "fly", slug: string): void;
  (e: "open", post: Post): void;
}>();

const t = useI18n();
const open = ref(false);
const query = ref("");
const active = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);
const isMac = ref(false);
const narrow = ref(false);

type PostHit = { kind: "post"; post: Post; key: string };
type TagHit = {
  kind: "tag";
  tag: string;
  count: number;
  color: string;
  key: string;
};
type Hit = PostHit | TagHit;

function norm(value: string) {
  return value.trim().toLowerCase();
}

const needle = computed(() => norm(query.value));

const postHits = computed<PostHit[]>(() => {
  const q = needle.value;
  if (!q) return [];
  return props.posts
    .filter(
      (post) =>
        norm(post.title).includes(q) ||
        post.tags.some((tag) => norm(tag).includes(q)),
    )
    .slice(0, 8)
    .map((post) => ({ kind: "post", post, key: `post:${post.slug}` }));
});

const tagHits = computed<TagHit[]>(() => {
  const q = needle.value;
  if (!q) return [];
  const buckets = new Map<
    string,
    { tag: string; count: number; color: string }
  >();
  for (const post of props.posts) {
    for (const tag of post.tags) {
      if (!norm(tag).includes(q)) continue;
      const id = norm(tag);
      const existing = buckets.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(id, { tag, count: 1, color: catColor(post.category) });
      }
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 6)
    .map((item) => ({ kind: "tag", ...item, key: `tag:${norm(item.tag)}` }));
});

const hits = computed<Hit[]>(() => [...postHits.value, ...tagHits.value]);

watch(hits, () => {
  active.value = 0;
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(value: string) {
  const safe = escapeHtml(value);
  const q = needle.value;
  if (!q) return safe;
  const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(
    new RegExp(pattern, "ig"),
    (match) => `<mark>${match}</mark>`,
  );
}

function displayDate(date: string) {
  return date.replaceAll(".", "-");
}

function shortcutLabel() {
  return isMac.value ? "⌘K" : "Ctrl K";
}

function show() {
  open.value = true;
  void nextTick(() => inputEl.value?.focus());
}
function hide() {
  open.value = false;
}
function toggle() {
  if (open.value) hide();
  else show();
}

function choose(hit: Hit, openPost: boolean) {
  if (hit.kind === "tag") {
    query.value = hit.tag;
    active.value = 0;
    void nextTick(() => inputEl.value?.focus());
    return;
  }
  hide();
  if (openPost) emit("open", hit.post);
  else emit("fly", hit.post.slug);
}

function onKeydown(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "k") {
    event.preventDefault();
    toggle();
    return;
  }
  if (!open.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    hide();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (hits.value.length)
      active.value = (active.value + 1) % hits.value.length;
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (hits.value.length) {
      active.value = (active.value - 1 + hits.value.length) % hits.value.length;
    }
    return;
  }
  if (event.key === "Enter") {
    const hit = hits.value[active.value];
    if (!hit) return;
    event.preventDefault();
    choose(hit, event.shiftKey);
  }
}

let pressTimer = 0;
let longPressed = false;
function onPointerDown(hit: Hit) {
  if (hit.kind !== "post" || !narrow.value) return;
  longPressed = false;
  window.clearTimeout(pressTimer);
  pressTimer = window.setTimeout(() => {
    longPressed = true;
    choose(hit, true);
  }, 480);
}
function onPointerUp() {
  window.clearTimeout(pressTimer);
}
function onRowClick(hit: Hit) {
  if (longPressed) {
    longPressed = false;
    return;
  }
  choose(hit, false);
}

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/.test(navigator.platform);
  const queryMedia = window.matchMedia("(max-width: 639px)");
  const apply = () => {
    narrow.value = queryMedia.matches;
  };
  apply();
  queryMedia.addEventListener("change", apply);
  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => {
    queryMedia.removeEventListener("change", apply);
    window.removeEventListener("keydown", onKeydown);
    window.clearTimeout(pressTimer);
  });
});
</script>

<template>
  <!-- Desktop: centered pill. Mobile: 44px icon just left of the language switch. -->
  <button
    v-if="!hidden"
    type="button"
    class="search-trigger fixed z-20 inline-flex cursor-pointer items-center justify-center border border-line bg-hud/80 text-ink backdrop-blur-hud transition-colors duration-150 hover:bg-fill-strong focus-visible:bg-fill-strong"
    :aria-label="t('search.open')"
    :aria-keyshortcuts="isMac ? 'Meta+K' : 'Control+K'"
    @click="show"
  >
    <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="6.25"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <path
        d="M16 16.5 20 20.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
      />
    </svg>
    <span class="search-trigger__label">{{ t("search.pill") }}</span>
    <kbd class="search-trigger__kbd">{{ shortcutLabel() }}</kbd>
  </button>

  <Transition name="panel-fade">
    <div
      v-if="open"
      class="search-scrim fixed inset-0 z-40 flex items-start justify-center p-4 pt-[12vh] max-sm:items-end max-sm:p-0"
      @click.self="hide"
    >
      <div
        class="search-panel flex w-[min(40rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-panel border border-line bg-panel/80 text-ink shadow-glass backdrop-blur-lg max-sm:w-full max-sm:rounded-t-panel max-sm:rounded-b-none"
        role="dialog"
        aria-modal="true"
        :aria-label="t('search.label')"
      >
        <div
          class="flex items-center gap-2 border-b border-line px-4 py-3 max-sm:px-3"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-5 shrink-0 text-ink-meta"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="6.25"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
            />
            <path
              d="M16 16.5 20 20.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
            />
          </svg>
          <input
            ref="inputEl"
            v-model="query"
            class="min-h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-dim"
            type="search"
            :placeholder="t('search.placeholder')"
            :aria-label="t('search.label')"
            autocomplete="off"
          />
          <button
            type="button"
            class="hidden min-h-11 shrink-0 cursor-pointer px-2 text-reading text-accent max-sm:inline-flex max-sm:items-center"
            @click="hide"
          >
            {{ t("search.cancel") }}
          </button>
          <kbd class="search-chip desk-only">Esc</kbd>
        </div>

        <div
          class="max-h-[min(60vh,28rem)] overflow-y-auto px-2 py-2 max-sm:max-h-[62dvh]"
        >
          <p
            v-if="!needle"
            class="px-3 py-6 text-center text-reading text-ink-meta"
          >
            {{ t("search.hint") }}
          </p>
          <p
            v-else-if="!hits.length"
            class="px-3 py-6 text-center text-reading text-ink-meta"
          >
            {{ t("search.empty") }}
          </p>
          <template v-else>
            <section v-if="postHits.length" :aria-label="t('search.posts')">
              <h2
                class="px-3 pt-1 pb-1.5 text-sm font-semibold tracking-label text-ink-meta uppercase"
              >
                {{ t("search.posts") }}
              </h2>
              <ul class="m-0 list-none p-0">
                <li v-for="(hit, index) in postHits" :key="hit.key">
                  <button
                    type="button"
                    class="flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left"
                    :class="
                      hits[active]?.key === hit.key
                        ? 'bg-fill-strong'
                        : 'hover:bg-fill'
                    "
                    @mouseenter="active = index"
                    @pointerdown="onPointerDown(hit)"
                    @pointerup="onPointerUp"
                    @pointerleave="onPointerUp"
                    @pointercancel="onPointerUp"
                    @click="onRowClick(hit)"
                  >
                    <span
                      class="size-8 shrink-0 rounded-full"
                      :style="{
                        background: catColor(hit.post.category as PostCategory),
                      }"
                    ></span>
                    <span class="min-w-0 flex-1">
                      <span
                        class="block truncate text-reading font-semibold"
                        v-html="highlight(hit.post.title)"
                      ></span>
                      <span class="mt-0.5 block truncate text-sm text-ink-meta">
                        {{ catLabel(hit.post.category) }} ·
                        {{ hit.post.summary }}
                      </span>
                    </span>
                    <span class="hidden shrink-0 text-right sm:block">
                      <template v-if="hits[active]?.key === hit.key">
                        <span class="block text-sm text-ink-soft"
                          >Enter {{ t("search.fly") }}</span
                        >
                        <span class="mt-0.5 block text-sm text-ink-meta"
                          >⇧ Enter {{ t("search.openPost") }}</span
                        >
                      </template>
                      <span v-else class="text-sm text-ink-meta">{{
                        displayDate(hit.post.date)
                      }}</span>
                    </span>
                    <span class="shrink-0 text-sm text-ink-meta sm:hidden">{{
                      displayDate(hit.post.date)
                    }}</span>
                  </button>
                </li>
              </ul>
            </section>

            <section v-if="tagHits.length" :aria-label="t('search.tags')">
              <h2
                class="px-3 pt-3 pb-1.5 text-sm font-semibold tracking-label text-ink-meta uppercase"
              >
                {{ t("search.tags") }}
              </h2>
              <ul class="m-0 list-none p-0">
                <li v-for="hit in tagHits" :key="hit.key">
                  <button
                    type="button"
                    class="flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left"
                    :class="
                      hits[active]?.key === hit.key
                        ? 'bg-fill-strong'
                        : 'hover:bg-fill'
                    "
                    @mouseenter="
                      active = postHits.length + tagHits.indexOf(hit)
                    "
                    @click="choose(hit, false)"
                  >
                    <span
                      class="size-3 shrink-0 rounded-full"
                      :style="{ background: hit.color }"
                    ></span>
                    <span
                      class="min-w-0 flex-1 truncate text-reading"
                      v-html="highlight(hit.tag)"
                    ></span>
                    <span class="shrink-0 text-sm text-ink-meta">{{
                      t("search.tagCount", { count: hit.count })
                    }}</span>
                  </button>
                </li>
              </ul>
            </section>
          </template>
        </div>

        <div
          class="hidden items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-ink-meta sm:flex"
        >
          <span class="inline-flex items-center gap-1"
            ><kbd class="search-chip">↑</kbd><kbd class="search-chip">↓</kbd>
            {{ t("search.kbd.select") }}</span
          >
          <span class="inline-flex items-center gap-1"
            ><kbd class="search-chip">Enter</kbd>
            {{ t("search.kbd.move") }}</span
          >
          <span class="inline-flex items-center gap-1"
            ><kbd class="search-chip">⇧ Enter</kbd>
            {{ t("search.kbd.open") }}</span
          >
          <span class="ml-auto inline-flex items-center gap-1"
            ><kbd class="search-chip">Esc</kbd>
            {{ t("search.kbd.close") }}</span
          >
        </div>
        <p
          class="m-0 border-t border-line px-4 py-3 text-center text-sm text-ink-meta sm:hidden"
        >
          {{ t("search.mobileHint") }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.search-trigger {
  top: calc(clamp(14px, 3vw, 24px) + var(--safe-t));
  left: 50%;
  height: 2.75rem;
  gap: 0.5rem;
  padding: 0 0.85rem 0 0.7rem;
  border-radius: 999px;
  transform: translateX(-50%);
}
.search-trigger__label {
  font-size: var(--text-reading);
}
.search-trigger__kbd {
  border: 1px solid var(--color-line);
  border-radius: 0.4rem;
  padding: 0.1rem 0.35rem;
  color: var(--color-ink-meta);
  font-family: var(--font-sans);
  font-size: 0.75rem;
}
@media (max-width: 639px) {
  .search-trigger {
    right: calc(var(--hud-edge) + var(--safe-r) + 6.25rem);
    left: auto;
    width: 2.75rem;
    padding: 0;
    border-radius: 999px;
    transform: none;
  }
  .search-trigger__label,
  .search-trigger__kbd {
    display: none;
  }
}
.search-scrim {
  background: rgb(0 0 0 / 0.45);
}
.search-chip {
  display: inline-flex;
  min-width: 1.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line);
  border-radius: 0.35rem;
  padding: 0.05rem 0.3rem;
  color: var(--color-ink-soft);
  font-family: var(--font-sans);
  font-size: 0.75rem;
}
@media (max-width: 639px) {
  .search-chip.desk-only {
    display: none;
  }
}
:deep(mark) {
  border-radius: 0.2rem;
  background: rgb(138 180 255 / 0.28);
  color: inherit;
}
</style>
