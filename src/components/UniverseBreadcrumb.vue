<script setup lang="ts">
import type { Galaxy } from "../utils/galaxies";

// Where am I: 星系群 › 星系 breadcrumb; the group crumb zooms out.
defineProps<{
  viewMode: "galaxy" | "group" | "toGroup" | "toGalaxy";
  activeGalaxy: Galaxy;
  hidden: boolean;
}>();

defineEmits<{
  (e: "open-group"): void;
}>();
</script>

<template>
  <nav
    class="breadcrumb"
    :class="{ 'breadcrumb--hidden': hidden }"
    aria-label="宇宙層級"
  >
    <button
      type="button"
      class="breadcrumb__link"
      :disabled="viewMode !== 'galaxy'"
      @click="$emit('open-group')"
    >
      星系群
    </button>
    <template v-if="viewMode === 'galaxy' || viewMode === 'toGalaxy'">
      <span class="breadcrumb__sep" aria-hidden="true">›</span>
      <span class="breadcrumb__current"
        >{{ activeGalaxy.name }} · {{ activeGalaxy.era }}</span
      >
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  position: fixed;
  top: clamp(14px, 3vw, 24px);
  left: clamp(16px, 3vw, 32px);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
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
.breadcrumb--hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
.breadcrumb__link {
  border: none;
  background: none;
  color: #8ab4ff;
  font: inherit;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
}
.breadcrumb__link:disabled {
  color: inherit;
  opacity: 0.75;
  cursor: default;
}
.breadcrumb__link:not(:disabled):hover,
.breadcrumb__link:not(:disabled):focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.breadcrumb__sep {
  opacity: 0.5;
}
.breadcrumb__current {
  opacity: 0.9;
}

/* Mobile: the list toggle owns the top-left corner; tuck the breadcrumb just
   above the legend instead so they never overlap. */
@media (max-width: 640px) {
  .breadcrumb {
    top: auto;
    bottom: clamp(58px, 14vw, 76px);
  }
}
</style>
