<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

// "?" corner button -> controls guide panel. Fully self-contained: the
// open/closed state, focus hand-off and Esc handling all live here.
defineProps<{
  /** Hide the button while a post is open (the reading panel takes over). */
  hidden: boolean;
  /** Show the overscroll-to-exit tip only when there are galaxies to exit to. */
  multiGalaxy: boolean;
}>();

const showInfo = ref(false);
const panelEl = ref<HTMLElement | null>(null);
watch(showInfo, async (open) => {
  if (open) {
    await nextTick();
    panelEl.value?.focus();
  }
});
</script>

<template>
  <button
    v-if="!hidden"
    type="button"
    class="info-button"
    aria-label="操作指南"
    @click="showInfo = true"
  >
    ?
  </button>

  <Transition name="panel-fade">
    <div
      v-if="showInfo"
      class="info-scrim"
      @click.self="showInfo = false"
      @keydown.escape.prevent="showInfo = false"
    >
      <section
        ref="panelEl"
        class="info-panel"
        role="dialog"
        aria-modal="true"
        aria-label="操作指南"
        tabindex="-1"
      >
        <button
          class="info-panel__close"
          aria-label="關閉操作指南"
          @click="showInfo = false"
        >
          ×
        </button>
        <h2 class="info-panel__title">操作指南</h2>
        <ul class="info-panel__list">
          <li><strong>拖曳</strong>旋轉視角，<strong>滾輪 / 雙指</strong>縮放</li>
          <li><strong>點擊星星</strong>閱讀文章，游標懸停可預覽</li>
          <li><strong>左下圖例</strong>篩選分類</li>
          <li>
            左上<strong>文章清單</strong>可瀏覽並<strong>搜尋</strong>全部文章，懸停點亮對應的星星，點擊即飛往該星並開啟文章
          </li>
          <li v-if="multiGalaxy">
            <strong>縮小到底後繼續滾動</strong>離開星系、綜覽星系群；點擊星系或滾輪放大即可返回
          </li>
          <li>左上<strong>星系群</strong>麵包屑隨時可切換視角</li>
        </ul>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.info-button {
  position: fixed;
  right: clamp(16px, 3vw, 28px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 20;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 16, 28, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.info-button:hover,
.info-button:focus-visible {
  background: rgba(255, 255, 255, 0.14);
}

/* Same glassmorphism family as the reading panel, centered instead of
   docked right. */
.info-scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 48px);
}
.info-panel {
  position: relative;
  width: min(400px, 92vw);
  max-height: 80vh;
  overflow-y: auto;
  padding: 32px 30px;
  border-radius: 20px;
  background: rgba(14, 18, 30, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  color: #eef2ff;
}
.info-panel:focus {
  outline: none;
}
.info-panel__close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #cdd6f4;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.info-panel__close:hover,
.info-panel__close:focus-visible {
  background: rgba(255, 255, 255, 0.14);
}
.info-panel__title {
  margin: 4px 0 16px;
  font-size: 20px;
  font-weight: 700;
}
.info-panel__list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.9;
  opacity: 0.9;
}
.info-panel__list li + li {
  margin-top: 6px;
}
.info-panel__list strong {
  color: #8ab4ff;
  font-weight: 600;
}

/* Panel fade/slide transition (slow, per the calm-motion goal). */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.35s ease;
}
.panel-fade-enter-active .info-panel,
.panel-fade-leave-active .info-panel {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
.panel-fade-enter-from .info-panel,
.panel-fade-leave-to .info-panel {
  transform: translateX(24px);
  opacity: 0;
}

/* Reduced motion: keep the UI transitions near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .panel-fade-enter-active,
  .panel-fade-leave-active,
  .panel-fade-enter-active .info-panel,
  .panel-fade-leave-active .info-panel {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}

/* Mobile: darker fill and square corners over the bright bloom ring, but the
   guide stays a centered card rather than a full sheet. */
@media (max-width: 640px) {
  .info-scrim {
    padding: 0;
  }
  .info-panel {
    height: 100dvh;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-sizing: border-box;
    padding: 28px 22px 40px;
    background: rgba(10, 13, 22, 0.72);
  }
  .panel-fade-enter-from .info-panel,
  .panel-fade-leave-to .info-panel {
    transform: translateY(24px);
  }
}
</style>
