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
    <div v-if="visible" class="exit-charge" aria-hidden="true">
      <span>繼續滾動 → 前往星系群</span>
      <span class="exit-charge__bar">
        <span
          class="exit-charge__fill"
          :style="{ width: progress * 100 + '%' }"
        ></span>
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.exit-charge {
  position: fixed;
  left: 50%;
  bottom: clamp(72px, 12vh, 120px);
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 16px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 13px;
  letter-spacing: 0.06em;
  pointer-events: none;
}
.exit-charge__bar {
  display: block;
  width: 150px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}
.exit-charge__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #8ab4ff;
}
.charge-fade-enter-active,
.charge-fade-leave-active {
  transition: opacity 0.25s ease;
}
.charge-fade-enter-from,
.charge-fade-leave-to {
  opacity: 0;
}
</style>
