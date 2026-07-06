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
  <!-- Mobile (max-sm): the list toggle owns the top-left corner; tuck the
       breadcrumb just above the legend instead so they never overlap. -->
  <nav
    class="fixed top-[clamp(14px,3vw,24px)] left-[clamp(16px,3vw,32px)] z-20 flex items-center gap-1.5 rounded-xl border border-white/8 bg-[#0c101c]/35 px-2.5 py-1.5 text-xs text-ink-soft backdrop-blur-[6px] transition-[opacity,transform] duration-[350ms] motion-reduce:transition-none max-sm:top-auto max-sm:bottom-[clamp(58px,14vw,76px)]"
    :class="{ 'pointer-events-none -translate-y-2 opacity-0': hidden }"
    aria-label="宇宙層級"
  >
    <button
      type="button"
      class="cursor-pointer rounded-md px-1.5 py-0.5 text-accent enabled:hover:bg-white/8 enabled:focus-visible:bg-white/8 disabled:cursor-default disabled:text-inherit disabled:opacity-75"
      :disabled="viewMode !== 'galaxy'"
      @click="$emit('open-group')"
    >
      星系群
    </button>
    <template v-if="viewMode === 'galaxy' || viewMode === 'toGalaxy'">
      <span class="opacity-50" aria-hidden="true">›</span>
      <span class="opacity-90"
        >{{ activeGalaxy.name }} · {{ activeGalaxy.era }}</span
      >
    </template>
  </nav>
</template>
