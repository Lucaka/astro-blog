<script setup lang="ts">
import type { Galaxy } from "../utils/galaxies";
import { useI18n } from "../i18n/vue";

// Where am I: 星系群 › 星系 breadcrumb; the group crumb zooms out.
defineProps<{
  viewMode: "galaxy" | "group" | "toGroup" | "toGalaxy";
  activeGalaxy: Galaxy;
  hidden: boolean;
}>();

defineEmits<{
  (e: "open-group"): void;
}>();

const t = useI18n();
</script>

<template>
  <!-- Mobile (max-sm): the list toggle owns the top-left corner; tuck the
       breadcrumb just above the legend instead so they never overlap. -->
  <nav
    class="fixed top-[calc(clamp(14px,3vw,24px)+var(--safe-t))] left-[calc(var(--hud-edge)+var(--safe-l))] z-20 flex max-w-[min(28rem,calc(100vw-8rem-var(--safe-l)-var(--safe-r)))] items-center gap-1.5 rounded-xl border border-line bg-hud/80 px-2.5 py-1 text-reading text-ink backdrop-blur-hud transition-[opacity,transform] duration-[350ms] motion-reduce:transition-none max-sm:top-auto max-sm:bottom-[calc(var(--hud-edge)+var(--safe-b)+var(--legend-block)+var(--hud-gap))] max-sm:max-w-[calc(100vw-var(--hud-edge)*2-var(--safe-l)-var(--safe-r))]"
    :class="{ 'pointer-events-none -translate-y-2 opacity-0': hidden }"
    :aria-label="t('breadcrumb.navLabel')"
  >
    <button
      type="button"
      class="inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-md px-2.5 text-reading text-accent enabled:hover:bg-fill-strong enabled:focus-visible:bg-fill-strong disabled:cursor-default disabled:text-ink-meta"
      :disabled="viewMode !== 'galaxy'"
      @click="$emit('open-group')"
    >
      {{ t("breadcrumb.group") }}
    </button>
    <template v-if="viewMode === 'galaxy' || viewMode === 'toGalaxy'">
      <span class="text-ink-dim" aria-hidden="true">›</span>
      <span class="min-w-0 truncate text-ink"
        >{{ t("galaxy.name", { n: activeGalaxy.index }) }} ·
        {{ activeGalaxy.era }}</span
      >
    </template>
  </nav>
</template>
