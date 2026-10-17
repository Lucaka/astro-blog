<script setup lang="ts">
import { CATEGORY_META, type PostCategory } from "../data/posts";
import { catColor } from "../utils/categories";

// Category legend: click a category to spotlight only its stars. The active
// set lives in the parent (the scene filter needs it too); empty = show all.
defineProps<{
  active: Set<PostCategory>;
  hidden: boolean;
}>();

defineEmits<{
  (e: "toggle", category: PostCategory): void;
}>();

const legend = (Object.keys(CATEGORY_META) as PostCategory[]).map((c) => ({
  category: c,
  label: CATEGORY_META[c].label,
  color: catColor(c),
}));
</script>

<template>
  <div
    class="legend-scroll fixed bottom-[calc(var(--hud-edge)+var(--safe-b))] left-[calc(var(--hud-edge)+var(--safe-l))] z-20 flex max-w-[calc(100vw-var(--safe-l)-var(--safe-r)-var(--hud-edge)*2-3.25rem)] flex-nowrap gap-1 overflow-x-auto rounded-xl border border-line bg-hud/80 px-2 py-1.5 text-sm text-ink backdrop-blur-hud transition-[opacity,transform] duration-[350ms] motion-reduce:transition-none"
    :class="{ 'pointer-events-none translate-y-2 opacity-0': hidden }"
  >
    <button
      v-for="item in legend"
      :key="item.category"
      type="button"
      class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm whitespace-nowrap transition-colors duration-200 hover:bg-fill-strong focus-visible:bg-fill-strong aria-pressed:bg-fill-strong"
      :class="
        active.size > 0 && !active.has(item.category)
          ? 'text-ink-dim'
          : 'text-ink'
      "
      :aria-pressed="active.has(item.category)"
      @click="$emit('toggle', item.category)"
    >
      <span
        class="size-2 rounded-full"
        :style="{ background: item.color }"
      ></span>
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.legend-scroll {
  scrollbar-width: none;
}
.legend-scroll::-webkit-scrollbar {
  display: none;
}
</style>
