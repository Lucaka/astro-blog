<script setup lang="ts">
// Hover tooltip: minimal card floated above the focused star or galaxy
// impostor. Purely presentational — the parent projects the 3D position to
// screen space and decides when it shows.
defineProps<{
  position: { left: string; top: string };
  title: string;
  meta: string;
  tags?: string[];
}>();
</script>

<template>
  <div class="star-tooltip" :style="position">
    <div class="star-tooltip__title">{{ title }}</div>
    <div class="star-tooltip__date">{{ meta }}</div>
    <div v-if="tags && tags.length" class="star-tooltip__tags">
      <span v-for="tag in tags" :key="tag" class="star-tooltip__tag">{{
        tag
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.star-tooltip {
  position: fixed;
  transform: translate(-50%, calc(-100% - 18px));
  pointer-events: none;
  padding: 8px 12px;
  min-width: 120px;
  border-radius: 10px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #eef2ff;
  white-space: nowrap;
  z-index: 20;
}
.star-tooltip__title {
  font-size: 13px;
  font-weight: 600;
}
.star-tooltip__date {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 2px;
}
.star-tooltip__tags {
  margin-top: 6px;
  display: flex;
  gap: 5px;
}
.star-tooltip__tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0.85;
}
</style>
