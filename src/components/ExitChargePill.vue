<script setup lang="ts">
import { useI18n } from "../i18n/vue";

// Exit pill: parked at the zoom wall — keep zooming out to leave. `progress`
// mirrors the overscroll charge (0 → 1 launches the group view).
defineProps<{
  visible: boolean;
  progress: number;
}>();

const t = useI18n();
</script>

<template>
  <Transition name="charge-fade">
    <div
      v-if="visible"
      class="pointer-events-none fixed bottom-[calc(var(--hud-edge)+var(--legend-block)+var(--hud-gap))] left-1/2 z-20 flex w-max max-w-[min(22rem,calc(100vw-2rem-var(--safe-l)-var(--safe-r)))] -translate-x-1/2 flex-col items-center gap-xs rounded-2xl border border-line bg-hud/80 px-4 py-2.5 text-center text-reading leading-snug tracking-[0.02em] text-ink backdrop-blur-hud max-sm:bottom-[calc(var(--hud-edge)+var(--safe-b)+var(--legend-block)+var(--crumb-block)+var(--hud-gap)*2)]"
      aria-hidden="true"
    >
      <span>{{ t("exit.label") }}</span>
      <span
        class="block h-[3px] w-[min(150px,70vw)] overflow-hidden rounded-full bg-fill-strong"
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
