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
  <div class="legend" :class="{ 'legend--hidden': hidden }">
    <button
      v-for="item in legend"
      :key="item.category"
      type="button"
      class="legend__item"
      :class="{
        'legend__item--muted': active.size > 0 && !active.has(item.category),
      }"
      :aria-pressed="active.has(item.category)"
      @click="$emit('toggle', item.category)"
    >
      <span class="legend__dot" :style="{ background: item.color }"></span>
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.legend {
  position: fixed;
  left: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(12, 16, 28, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 12px;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.legend--hidden {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}
.legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  background: none;
  color: inherit;
  font: inherit;
  opacity: 0.85;
  cursor: pointer;
  transition:
    opacity 0.25s ease,
    background 0.15s ease;
}
.legend__item:hover,
.legend__item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.legend__item[aria-pressed="true"] {
  background: rgba(255, 255, 255, 0.12);
  opacity: 1;
}
.legend__item--muted {
  opacity: 0.35;
}
.legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Reduced motion: keep the show/hide transition near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .legend {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}
</style>
