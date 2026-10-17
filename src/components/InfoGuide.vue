<script setup lang="ts">
import { ref } from "vue";
import GlassPanel from "./GlassPanel.vue";
import { useI18n } from "../i18n/vue";

// "?" corner button -> controls guide panel. The scrim, card chrome, close
// button and modal a11y live in <GlassPanel>; this component owns only the
// open/closed state and the guide content.
defineProps<{
  /** Hide the button while a post is open (the reading panel takes over). */
  hidden: boolean;
  /** Show the overscroll-to-exit tip only when there are galaxies to exit to. */
  multiGalaxy: boolean;
}>();

const t = useI18n();
const showInfo = ref(false);
</script>

<template>
  <button
    v-if="!hidden"
    type="button"
    class="fixed right-[calc(var(--hud-edge)+var(--safe-r))] bottom-[calc(var(--hud-edge)+var(--safe-b))] z-20 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-hud/80 text-base leading-none font-semibold text-ink backdrop-blur-hud transition-colors duration-150 hover:bg-fill-strong focus-visible:bg-fill-strong"
    :aria-label="t('guide.button')"
    @click="showInfo = true"
  >
    ?
  </button>

  <!-- Same glass shell as the reading panel, but centered instead of docked
       right (align defaults to "center"). -->
  <GlassPanel
    :open="showInfo"
    :label="t('guide.title')"
    :close-label="t('guide.close')"
    @close="showInfo = false"
  >
    <h2 class="mt-1 mb-4 text-xl font-bold">{{ t("guide.title") }}</h2>
    <!-- Guide items carry inline <strong> emphasis, so they're stored as
         trusted markup in the dictionary and rendered with v-html. -->
    <ul
      class="list-disc pl-[18px] text-reading leading-[1.85] text-ink-body [&_strong]:font-semibold [&_strong]:text-accent [&>li+li]:mt-1.5"
    >
      <li v-html="t('guide.item1')"></li>
      <li v-html="t('guide.item2')"></li>
      <li v-html="t('guide.item3')"></li>
      <li v-html="t('guide.item4')"></li>
      <li v-if="multiGalaxy" v-html="t('guide.item5')"></li>
      <li v-html="t('guide.item6')"></li>
    </ul>
  </GlassPanel>
</template>
