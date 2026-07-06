<script setup lang="ts">
// Exit pill: parked at the zoom wall — keep scrolling to leave. `progress`
// mirrors the overscroll charge (0 → 1 launches the group view).
defineProps<{
  visible: boolean;
  progress: number;
}>();
</script>

<template>
  <Transition name="charge-fade">
    <div
      v-if="visible"
      class="pointer-events-none fixed bottom-[clamp(72px,12vh,120px)] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-[7px] rounded-2xl border border-white/12 bg-[#0c101c]/55 px-[18px] py-2.5 text-[13px] tracking-[0.06em] text-ink-soft backdrop-blur-[6px]"
      aria-hidden="true"
    >
      <span>繼續滾動 → 前往星系群</span>
      <span
        class="block h-[3px] w-[150px] overflow-hidden rounded-full bg-white/15"
      >
        <span
          class="block h-full rounded-full bg-accent"
          :style="{ width: progress * 100 + '%' }"
        ></span>
      </span>
    </div>
  </Transition>
</template>

<style scoped>
/* Vue <Transition> hooks are runtime-generated class names, so they stay as
   CSS rather than Tailwind utilities. */
.charge-fade-enter-active,
.charge-fade-leave-active {
  transition: opacity 0.25s ease;
}
.charge-fade-enter-from,
.charge-fade-leave-to {
  opacity: 0;
}
</style>
