<script setup lang="ts">
import { GITHUB_ICON_PATH, GITHUB_PROFILE } from "../data/identity";
import { useI18n } from "../i18n/vue";

// Profile chip for the 3D overlay. Below 720px it sits on its own row under
// the language switch so it never shares a line with search or the list
// toggle. From 720px it joins that top row, just left of the language switch
// (the same 6.25rem clearance the mobile search icon uses). Hidden while a
// post is open so it cannot sit on the reading panel's close button.
defineProps<{ hidden: boolean }>();

const t = useI18n();
</script>

<template>
  <a
    v-show="!hidden"
    class="github-hud"
    :href="GITHUB_PROFILE"
    rel="me noopener"
    target="_blank"
  >
    <svg viewBox="0 0 24 24" class="github-hud__icon" aria-hidden="true">
      <path fill="currentColor" :d="GITHUB_ICON_PATH" />
    </svg>
    <span>{{ t("nav.github") }}</span>
  </a>
</template>

<style scoped>
.github-hud {
  position: fixed;
  z-index: 20;
  top: calc(clamp(14px, 3vw, 24px) + var(--safe-t) + 3.25rem);
  right: calc(var(--hud-edge) + var(--safe-r));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height: 2.75rem;
  min-width: 2.75rem;
  padding: 0 0.85rem 0 0.65rem;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-hud) 80%, transparent);
  color: var(--color-ink);
  font-size: var(--text-reading);
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  backdrop-filter: blur(var(--blur-hud));
}
.github-hud__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex: none;
}
.github-hud:hover,
.github-hud:focus-visible {
  background: var(--color-fill-strong);
}
@media (min-width: 720px) {
  .github-hud {
    top: calc(clamp(14px, 3vw, 24px) + var(--safe-t));
    right: calc(var(--hud-edge) + var(--safe-r) + 6.25rem);
  }
}
/* Mobile sheets put their close button in this corner. */
@media (max-width: 639px) {
  :global(body:has([role="dialog"][aria-modal="true"]) .github-hud) {
    visibility: hidden;
  }
}
</style>
