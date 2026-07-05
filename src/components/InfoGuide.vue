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
    class="fixed right-[clamp(16px,3vw,28px)] bottom-[clamp(16px,3vw,28px)] z-20 size-[34px] cursor-pointer rounded-full border border-white/14 bg-[#0c101c]/45 text-base leading-none font-semibold text-ink-soft backdrop-blur-[6px] transition-colors duration-150 hover:bg-white/14 focus-visible:bg-white/14"
    aria-label="操作指南"
    @click="showInfo = true"
  >
    ?
  </button>

  <!-- Same glassmorphism family as the reading panel, centered instead of
       docked right. Mobile (max-sm): darker fill and square corners over the
       bright bloom ring, but the guide stays a centered card, not a sheet. -->
  <Transition name="panel-fade">
    <div
      v-if="showInfo"
      class="fixed inset-0 z-30 flex items-center justify-center p-[clamp(16px,4vw,48px)] max-sm:p-0"
      @click.self="showInfo = false"
      @keydown.escape.prevent="showInfo = false"
    >
      <section
        ref="panelEl"
        class="info-panel relative max-h-[80vh] w-[min(400px,92vw)] overflow-y-auto rounded-[20px] border border-white/12 bg-[#0e121e]/45 px-[30px] py-8 text-ink shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-lg focus:outline-none max-sm:h-dvh max-sm:rounded-none max-sm:border-x-0 max-sm:bg-[#0a0d16]/72 max-sm:px-[22px] max-sm:pt-7 max-sm:pb-10"
        role="dialog"
        aria-modal="true"
        aria-label="操作指南"
        tabindex="-1"
      >
        <button
          class="absolute top-3.5 right-4 size-8 cursor-pointer rounded-lg bg-white/6 text-xl leading-none text-[#cdd6f4] transition-colors duration-150 hover:bg-white/14 focus-visible:bg-white/14"
          aria-label="關閉操作指南"
          @click="showInfo = false"
        >
          ×
        </button>
        <h2 class="mt-1 mb-4 text-xl font-bold">操作指南</h2>
        <ul
          class="list-disc pl-[18px] text-sm leading-[1.9] opacity-90 [&_strong]:font-semibold [&_strong]:text-accent [&>li+li]:mt-1.5"
        >
          <li>
            <strong>拖曳</strong>旋轉視角，<strong>滾輪 / 雙指</strong>縮放
          </li>
          <li><strong>點擊星星</strong>閱讀文章，游標懸停可預覽</li>
          <li><strong>左下圖例</strong>篩選分類</li>
          <li>
            左上<strong>文章清單</strong>可瀏覽並<strong>搜尋</strong>全部文章，懸停點亮對應的星星，點擊即飛往該星並開啟文章
          </li>
          <li v-if="multiGalaxy">
            <strong>縮小到底後繼續滾動</strong
            >離開星系、綜覽星系群；點擊星系或滾輪放大即可返回
          </li>
          <li>左上<strong>星系群</strong>麵包屑隨時可切換視角</li>
        </ul>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
/* Panel fade/slide transition (slow, per the calm-motion goal). Vue
   <Transition> hooks are runtime-generated class names, so they stay as CSS
   rather than Tailwind utilities. */
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

/* Mobile: the guide slides up from below instead of in from the right. */
@media (max-width: 640px) {
  .panel-fade-enter-from .info-panel,
  .panel-fade-leave-to .info-panel {
    transform: translateY(24px);
  }
}
</style>
