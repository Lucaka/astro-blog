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
    class="fixed bottom-[clamp(16px,3vw,28px)] left-[clamp(16px,3vw,32px)] z-20 flex flex-wrap gap-1 rounded-xl border border-white/8 bg-[#0c101c]/35 px-2 py-1.5 text-xs text-ink-soft backdrop-blur-[6px] transition-[opacity,transform] duration-[350ms] motion-reduce:transition-none"
    :class="{ 'pointer-events-none translate-y-2 opacity-0': hidden }"
  >
    <button
      v-for="item in legend"
      :key="item.category"
      type="button"
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 transition-[opacity,background-color] duration-200 hover:bg-white/8 focus-visible:bg-white/8 aria-pressed:bg-white/12"
      :class="
        active.size > 0 && !active.has(item.category)
          ? 'opacity-35'
          : 'opacity-85 aria-pressed:opacity-100'
      "
      :aria-pressed="active.has(item.category)"
      @click="$emit('toggle', item.category)"
    >
      <span class="size-2 rounded-full" :style="{ background: item.color }"></span>
      {{ item.label }}
    </button>
  </div>
</template>
