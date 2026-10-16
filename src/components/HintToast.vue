<script setup lang="ts">
// One quiet line of guidance, centered near the bottom. Decorative only:
// hidden from the accessibility tree, faded in and out slowly.
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <Transition name="hint-fade">
    <p
      v-if="show"
      class="pointer-events-none fixed bottom-[calc(var(--hud-edge)+var(--legend-block)+var(--hud-gap))] left-1/2 z-20 w-max max-w-[min(26rem,calc(100vw-2rem-var(--safe-l)-var(--safe-r)))] -translate-x-1/2 rounded-2xl border border-line bg-hud/80 px-4 py-2.5 text-center text-[15px] leading-snug tracking-[0.02em] text-ink backdrop-blur-[6px] max-sm:bottom-[calc(var(--hud-edge)+var(--safe-b)+var(--legend-block)+var(--crumb-block)+var(--hud-gap)*2)]"
      aria-hidden="true"
    >
      <slot />
    </p>
  </Transition>
</template>

<style scoped>
/* Vue <Transition> hooks are runtime-generated class names, so they stay as
   CSS rather than Tailwind utilities. */
.hint-fade-enter-active {
  transition: opacity 1.2s ease 0.8s;
}
.hint-fade-leave-active {
  transition: opacity 0.8s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

/* Reduced motion: keep the fade near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .hint-fade-enter-active,
  .hint-fade-leave-active {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}
</style>
