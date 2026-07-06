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
    class="pointer-events-none fixed z-20 min-w-[120px] -translate-x-1/2 translate-y-[calc(-100%_-_18px)] rounded-[10px] border border-white/14 bg-[#0c101c]/55 px-3 py-2 whitespace-nowrap text-ink backdrop-blur-[6px]"
    :style="position"
  >
    <div class="text-[13px] font-semibold">{{ title }}</div>
    <div class="mt-0.5 text-[11px] opacity-60">{{ meta }}</div>
    <div v-if="tags && tags.length" class="mt-1.5 flex gap-[5px]">
      <span
        v-for="tag in tags"
        :key="tag"
        class="rounded-md bg-white/8 px-1.5 py-px text-[10px] opacity-85"
        >{{ tag }}</span
      >
    </div>
  </div>
</template>
