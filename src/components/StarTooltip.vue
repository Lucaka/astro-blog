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
  <div
    class="pointer-events-none fixed z-20 max-w-[min(18rem,calc(100vw-1.5rem))] min-w-[120px] -translate-x-1/2 translate-y-[calc(-100%_-_18px)] rounded-control border border-line bg-hud/85 px-3 py-2 text-ink backdrop-blur-hud"
    :style="position"
  >
    <div class="text-reading leading-snug font-semibold text-balance">
      {{ title }}
    </div>
    <div class="mt-0.5 text-sm leading-snug text-ink-meta">{{ meta }}</div>
    <div v-if="tags && tags.length" class="mt-1.5 flex flex-wrap gap-2xs">
      <span
        v-for="tag in tags"
        :key="tag"
        class="rounded-md bg-fill-strong px-1.5 py-0.5 text-xs text-ink-soft"
        >{{ tag }}</span
      >
    </div>
  </div>
</template>
