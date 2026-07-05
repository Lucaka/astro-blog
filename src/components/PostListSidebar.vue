<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { Post } from "../data/posts";
import { catColor, catLabel } from "../utils/categories";
import { postMeta } from "../utils/posts";

// Article list sidebar: a plain, blog-style index of every post, plus a
// search box that filters it in place. Matches span every galaxy. The scene
// bridges (star highlight, camera flight) live in the parent, so hovering an
// entry only emits `hover` and picking one only emits `open`.
const props = defineProps<{
  posts: Post[];
  /** The sidebar only makes sense in the galaxy view with no post open. */
  active: boolean;
}>();

const emit = defineEmits<{
  (e: "hover", slug: string | null): void;
  (e: "open", post: Post): void;
}>();

// Open/closed state is remembered across visits.
const showList = ref(false);
const LIST_KEY = "universe-list-open";
onMounted(() => {
  try {
    showList.value = localStorage.getItem(LIST_KEY) === "1";
  } catch {
    /* private mode: default to closed */
  }
});
function toggleList() {
  showList.value = !showList.value;
  try {
    localStorage.setItem(LIST_KEY, showList.value ? "1" : "0");
  } catch {
    /* private mode: the list just won't remember */
  }
}

const listVisible = computed(() => showList.value && props.active);

const searchQuery = ref("");
const searching = computed(() => searchQuery.value.trim().length > 0);
const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.posts;
  return props.posts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      catLabel(p.category).toLowerCase().includes(q),
  );
});
function onSearchEnter() {
  const first = searching.value ? filteredPosts.value[0] : undefined;
  if (first) emit("open", first);
}

// The panel can disappear out from under the cursor (opening a post, leaving
// the galaxy view), so mouseleave alone can't be trusted to clean up the
// star highlight.
watch(listVisible, (visible) => {
  if (!visible) emit("hover", null);
});
</script>

<template>
  <button
    type="button"
    class="list-toggle"
    :class="{ 'list-toggle--hidden': !active }"
    :aria-expanded="showList"
    aria-controls="post-list-panel"
    @click="toggleList"
  >
    <span aria-hidden="true">☰</span> 文章清單
  </button>
  <Transition name="list-slide">
    <aside
      v-if="listVisible"
      id="post-list-panel"
      class="post-list"
      aria-label="文章清單"
    >
      <!-- Typing filters the list below in place; Enter picks the first
           match. Cross-galaxy matches are included — clicking one dives
           into its galaxy on the way to the star. -->
      <div class="post-list__search">
        <input
          v-model="searchQuery"
          class="post-list__search-input"
          type="search"
          placeholder="搜尋星系…"
          aria-label="搜尋文章"
          @keydown.enter.prevent="onSearchEnter"
          @keydown.escape="searchQuery = ''"
        />
      </div>
      <p class="post-list__count" role="status">
        <template v-if="searching"
          >符合 {{ filteredPosts.length }} / {{ posts.length }} 篇</template
        >
        <template v-else>共 {{ posts.length }} 篇</template>
      </p>
      <p v-if="!filteredPosts.length" class="post-list__empty">
        沒有符合的星星
      </p>
      <ul v-else class="post-list__items">
        <li v-for="post in filteredPosts" :key="post.slug">
          <button
            type="button"
            class="post-list__item"
            @mouseenter="emit('hover', post.slug)"
            @mouseleave="emit('hover', null)"
            @focus="emit('hover', post.slug)"
            @blur="emit('hover', null)"
            @click="emit('open', post)"
          >
            <span
              class="post-list__dot"
              :style="{ background: catColor(post.category) }"
            ></span>
            <span class="post-list__text">
              <span class="post-list__title">{{ post.title }}</span>
              <span class="post-list__meta">{{ postMeta(post) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </aside>
  </Transition>
</template>

<style scoped>
/* --- Article list sidebar: a Dyson plate ----------------------------------
   The chamfered octagon + pale-blue wireframe echoes the Dyson plates
   orbiting the black hole (three/blackhole/dysonSphere.ts): a faint #88ccff
   fill behind a brighter #aaddff border. clip-path would cut away a real CSS
   border, so the outline is layered instead: the element clips to the
   octagon, ::before paints the line color edge-to-edge, and ::after paints
   the fill inset 1px with the same octagon — leaving a 1px lit rim. */
.list-toggle {
  position: fixed;
  top: calc(clamp(14px, 3vw, 24px) + 42px);
  left: clamp(16px, 3vw, 32px);
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: none;
  background: none;
  isolation: isolate;
  clip-path: polygon(
    9px 0,
    calc(100% - 9px) 0,
    100% 9px,
    100% calc(100% - 9px),
    calc(100% - 9px) 100%,
    9px 100%,
    0 calc(100% - 9px),
    0 9px
  );
  color: #d7def5;
  font-size: 12px;
  cursor: pointer;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.list-toggle::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.4);
}
.list-toggle::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(12, 16, 28, 0.55);
  clip-path: polygon(
    9px 0,
    calc(100% - 9px) 0,
    100% 9px,
    100% calc(100% - 9px),
    calc(100% - 9px) 100%,
    9px 100%,
    0 calc(100% - 9px),
    0 9px
  );
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.15s ease;
}
.list-toggle:hover::after,
.list-toggle:focus-visible::after {
  background: rgba(136, 204, 255, 0.18);
}
.list-toggle:focus-visible::before {
  background: rgba(170, 221, 255, 0.9);
}
.list-toggle--hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
.post-list {
  position: fixed;
  top: calc(clamp(14px, 3vw, 24px) + 84px);
  left: clamp(16px, 3vw, 32px);
  bottom: clamp(64px, 10vh, 96px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(290px, calc(100vw - 32px));
  border: none;
  background: none;
  isolation: isolate;
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  color: #eef2ff;
  overflow: hidden;
}
.post-list::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.4);
}
.post-list::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(11, 17, 30, 0.72);
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* The plates' faint additive fill, as a whisper of inner glow. */
  box-shadow: inset 0 0 30px rgba(136, 204, 255, 0.07);
}
.post-list__search {
  flex: none;
  position: relative;
  isolation: isolate;
  margin: 14px 14px 0;
  clip-path: polygon(
    7px 0,
    calc(100% - 7px) 0,
    100% 7px,
    100% calc(100% - 7px),
    calc(100% - 7px) 100%,
    7px 100%,
    0 calc(100% - 7px),
    0 7px
  );
}
.post-list__search::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.35);
  transition: background 0.15s ease;
}
.post-list__search::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(9, 14, 25, 0.7);
  clip-path: polygon(
    7px 0,
    calc(100% - 7px) 0,
    100% 7px,
    100% calc(100% - 7px),
    calc(100% - 7px) 100%,
    7px 100%,
    0 calc(100% - 7px),
    0 7px
  );
}
.post-list__search:focus-within::before {
  background: rgba(138, 180, 255, 0.8);
}
.post-list__search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #eef2ff;
  font-size: 13px;
  outline: none;
}
.post-list__search-input::placeholder {
  color: rgba(215, 222, 245, 0.55);
}
.post-list__count {
  flex: none;
  margin: 0;
  padding: 10px 16px 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #aab4d4;
}
.post-list__empty {
  margin: 0;
  padding: 4px 16px 14px;
  color: #aab4d4;
  font-size: 12px;
}
.post-list__items {
  flex: 1;
  margin: 0;
  /* Extra bottom room keeps the last entry clear of the chamfered corners. */
  padding: 0 10px 16px;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.post-list__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.post-list__item:hover,
.post-list__item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.post-list__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
}
.post-list__text {
  min-width: 0;
}
.post-list__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.post-list__meta {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.6;
}
.list-slide-enter-active,
.list-slide-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.list-slide-enter-from,
.list-slide-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

/* Mobile: the breadcrumb lives at the bottom, so the toggle takes the top-left
   corner; the panel stops above the breadcrumb + legend stack. */
@media (max-width: 640px) {
  .list-toggle {
    top: clamp(14px, 3vw, 24px);
  }
  .post-list {
    top: calc(clamp(14px, 3vw, 24px) + 44px);
    bottom: calc(clamp(58px, 14vw, 76px) + 46px);
  }
}

/* Reduced motion: keep the UI transitions near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .list-slide-enter-active,
  .list-slide-leave-active,
  .list-toggle {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}
</style>
