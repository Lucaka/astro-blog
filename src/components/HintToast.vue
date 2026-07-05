<script setup lang="ts">
// One quiet line of guidance, centered near the bottom. Decorative only:
// hidden from the accessibility tree, faded in and out slowly.
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <Transition name="hint-fade">
    <p v-if="show" class="hint" aria-hidden="true">
      <slot />
    </p>
  </Transition>
</template>

<style scoped>
.hint {
  position: fixed;
  left: 50%;
  bottom: clamp(72px, 12vh, 120px);
  transform: translateX(-50%);
  z-index: 20;
  margin: 0;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 13px;
  letter-spacing: 0.06em;
  pointer-events: none;
}
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
