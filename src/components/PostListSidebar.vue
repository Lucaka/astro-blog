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
  <!-- Mobile (max-sm): the breadcrumb lives at the bottom, so the toggle
       takes the top-left corner; the panel stops above the breadcrumb +
       legend stack. -->
  <button
    type="button"
    class="list-toggle fixed top-[calc(clamp(14px,3vw,24px)+42px)] left-[clamp(16px,3vw,32px)] z-20 inline-flex cursor-pointer items-center gap-[7px] px-3.5 py-2 text-xs text-ink-soft transition-[opacity,transform] duration-[350ms] motion-reduce:transition-none max-sm:top-[clamp(14px,3vw,24px)]"
    :class="{ 'pointer-events-none -translate-y-2 opacity-0': !active }"
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
      class="post-list fixed top-[calc(clamp(14px,3vw,24px)+84px)] bottom-[clamp(64px,10vh,96px)] left-[clamp(16px,3vw,32px)] z-20 flex w-[min(290px,calc(100vw-32px))] flex-col overflow-hidden text-ink max-sm:top-[calc(clamp(14px,3vw,24px)+44px)] max-sm:bottom-[calc(clamp(58px,14vw,76px)+46px)]"
      aria-label="文章清單"
    >
      <!-- Typing filters the list below in place; Enter picks the first
           match. Cross-galaxy matches are included — clicking one dives
           into its galaxy on the way to the star. -->
      <div class="post-list__search relative mx-3.5 mt-3.5 flex-none">
        <input
          v-model="searchQuery"
          class="w-full bg-transparent px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft/55"
          type="search"
          placeholder="搜尋星系…"
          aria-label="搜尋文章"
          @keydown.enter.prevent="onSearchEnter"
          @keydown.escape="searchQuery = ''"
        />
      </div>
      <p
        class="m-0 flex-none px-4 pt-2.5 pb-2 text-[11px] tracking-[0.08em] text-ink-dim"
        role="status"
      >
        <template v-if="searching"
          >符合 {{ filteredPosts.length }} / {{ posts.length }} 篇</template
        >
        <template v-else>共 {{ posts.length }} 篇</template>
      </p>
      <p v-if="!filteredPosts.length" class="m-0 px-4 pt-1 pb-3.5 text-xs text-ink-dim">
        沒有符合的星星
      </p>
      <!-- Extra bottom padding keeps the last entry clear of the chamfered
           corners. -->
      <ul
        v-else
        class="m-0 flex-1 list-none overflow-y-auto overscroll-contain px-2.5 pb-4"
      >
        <li v-for="post in filteredPosts" :key="post.slug">
          <button
            type="button"
            class="flex w-full cursor-pointer items-start gap-2.5 rounded-[10px] px-2.5 py-[9px] text-left transition-colors duration-150 hover:bg-white/8 focus-visible:bg-white/8"
            @mouseenter="emit('hover', post.slug)"
            @mouseleave="emit('hover', null)"
            @focus="emit('hover', post.slug)"
            @blur="emit('hover', null)"
            @click="emit('open', post)"
          >
            <span
              class="mt-[5px] size-2 flex-none rounded-full"
              :style="{ background: catColor(post.category) }"
            ></span>
            <span class="min-w-0">
              <span class="block text-[13px] leading-[1.45] font-semibold">{{
                post.title
              }}</span>
              <span class="mt-0.5 block text-[11px] opacity-60">{{
                postMeta(post)
              }}</span>
            </span>
          </button>
        </li>
      </ul>
    </aside>
  </Transition>
</template>

<style scoped>
/* --- Dyson-plate chrome ----------------------------------------------------
   The chamfered octagon + pale-blue wireframe echoes the Dyson plates
   orbiting the black hole (three/blackhole/dysonSphere.ts): a faint #88ccff
   fill behind a brighter #aaddff border. clip-path would cut away a real CSS
   border, so the outline is layered instead: the element clips to the
   octagon, ::before paints the line color edge-to-edge, and ::after paints
   the fill inset 1px with the same octagon — leaving a 1px lit rim. This
   pseudo-element layering stays as CSS; layout and typography live as
   Tailwind utilities in the template. */
.list-toggle {
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
.post-list {
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
  isolation: isolate;
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

/* Vue <Transition> hooks are runtime-generated class names, so they stay as
   CSS rather than Tailwind utilities. */
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

/* Reduced motion: keep the slide near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .list-slide-enter-active,
  .list-slide-leave-active {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}
</style>
