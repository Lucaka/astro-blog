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
      class="pointer-events-none fixed bottom-[clamp(72px,12vh,120px)] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/12 bg-[#0c101c]/55 px-[18px] py-2.5 text-[13px] tracking-[0.06em] text-ink-soft backdrop-blur-[6px]"
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
