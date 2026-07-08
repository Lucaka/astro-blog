<script setup lang="ts">
import { ref } from "vue";
import GlassPanel from "./GlassPanel.vue";

// "?" corner button -> controls guide panel. The scrim, card chrome, close
// button and modal a11y live in <GlassPanel>; this component owns only the
// open/closed state and the guide content.
defineProps<{
  /** Hide the button while a post is open (the reading panel takes over). */
  hidden: boolean;
  /** Show the overscroll-to-exit tip only when there are galaxies to exit to. */
  multiGalaxy: boolean;
}>();

const showInfo = ref(false);
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

  <!-- Same glass shell as the reading panel, but centered instead of docked
       right (align defaults to "center"). -->
  <GlassPanel
    :open="showInfo"
    label="操作指南"
    close-label="關閉操作指南"
    @close="showInfo = false"
  >
    <h2 class="mt-1 mb-4 text-xl font-bold">操作指南</h2>
    <ul
      class="list-disc pl-[18px] text-sm leading-[1.9] opacity-90 [&_strong]:font-semibold [&_strong]:text-accent [&>li+li]:mt-1.5"
    >
      <li><strong>拖曳</strong>旋轉視角，<strong>滾輪 / 雙指</strong>縮放</li>
      <li><strong>點擊星星</strong>閱讀文章，游標懸停可預覽</li>
      <li><strong>左下圖例</strong>篩選分類</li>
      <li>
        左上<strong>文章清單</strong>可瀏覽並<strong>搜尋</strong>全部文章，懸停點亮對應的星星，點擊即飛往該星並開啟文章
      </li>
      <li v-if="multiGalaxy">
        <strong>縮小到底後持續縮小</strong
        >離開星系、綜覽星系群；點擊星系或放大即可返回
      </li>
      <li>左上<strong>星系群</strong>麵包屑隨時可切換視角</li>
    </ul>
  </GlassPanel>
</template>
