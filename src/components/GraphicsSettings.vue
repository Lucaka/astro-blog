<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { GraphicsSettings, QualityId } from "../utils/graphics";
import { useI18n } from "../i18n/vue";

defineProps<{
  hidden: boolean;
  settings: GraphicsSettings;
  fps: number;
  throttled: boolean;
  osReduced: boolean;
}>();

const emit = defineEmits<{
  (e: "quality", id: QualityId): void;
  (e: "bloom", on: boolean): void;
  (e: "autoLower", on: boolean): void;
  (e: "reduced", on: boolean): void;
}>();

const t = useI18n();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const options: QualityId[] = ["high", "balanced", "saver"];

function label(id: QualityId) {
  if (id === "high") return t("gate.quality.high");
  if (id === "saver") return t("gate.quality.saver");
  return t("gate.quality.balanced");
}

function onDocPointer(event: PointerEvent) {
  if (!open.value || !root.value) return;
  if (event.target instanceof Node && root.value.contains(event.target)) return;
  open.value = false;
}
function onKey(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocPointer);
  window.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointer);
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <div v-show="!hidden" ref="root" class="graphics-settings">
    <button
      type="button"
      class="graphics-settings__gear"
      :aria-expanded="open"
      :aria-label="t('settings.open')"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
          d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="graphics-settings__pop"
      role="dialog"
      :aria-label="t('settings.title')"
    >
      <div class="graphics-settings__head">
        <h2 class="graphics-settings__title">{{ t("settings.title") }}</h2>
        <span class="graphics-settings__fps" :class="{ 'is-low': throttled }">{{
          t("settings.fps", { n: fps })
        }}</span>
      </div>

      <p class="graphics-settings__label">{{ t("settings.quality") }}</p>
      <div
        class="graphics-settings__segment"
        role="radiogroup"
        :aria-label="t('settings.quality')"
      >
        <button
          v-for="id in options"
          :key="id"
          type="button"
          role="radio"
          :aria-checked="settings.quality === id"
          :class="{ 'is-selected': settings.quality === id }"
          @click="emit('quality', id)"
        >
          {{ label(id) }}
        </button>
      </div>

      <label class="graphics-settings__row">
        <span>
          <span class="graphics-settings__row-title">{{
            t("settings.bloom")
          }}</span>
          <span class="graphics-settings__row-hint">{{
            t("settings.bloomHint")
          }}</span>
        </span>
        <input
          class="graphics-settings__switch"
          type="checkbox"
          :checked="settings.bloom"
          @change="emit('bloom', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <label class="graphics-settings__row">
        <span>
          <span class="graphics-settings__row-title">{{
            t("settings.autoLower")
          }}</span>
          <span class="graphics-settings__row-hint">{{
            t("settings.autoLowerHint")
          }}</span>
        </span>
        <input
          class="graphics-settings__switch"
          type="checkbox"
          :checked="settings.autoLower"
          @change="
            emit('autoLower', ($event.target as HTMLInputElement).checked)
          "
        />
      </label>
      <label class="graphics-settings__row">
        <span>
          <span class="graphics-settings__row-title">{{
            t("settings.reduced")
          }}</span>
          <span class="graphics-settings__row-hint">{{
            t("settings.reducedHint")
          }}</span>
        </span>
        <input
          class="graphics-settings__switch"
          type="checkbox"
          :checked="settings.reducedMotion ?? osReduced"
          :disabled="osReduced"
          @change="emit('reduced', ($event.target as HTMLInputElement).checked)"
        />
      </label>
      <p class="graphics-settings__note">{{ t("settings.note") }}</p>
    </div>
  </div>
</template>

<style scoped>
.graphics-settings {
  position: fixed;
  right: calc(var(--hud-edge) + var(--safe-r) + 3.25rem);
  bottom: calc(var(--hud-edge) + var(--safe-b));
  z-index: 20;
}
.graphics-settings__gear {
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-hud) 80%, transparent);
  color: var(--color-ink);
  backdrop-filter: blur(var(--blur-hud));
}
.graphics-settings__gear:hover,
.graphics-settings__gear:focus-visible {
  background: var(--color-fill-strong);
}
.graphics-settings__pop {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.6rem);
  width: min(19rem, calc(100vw - 1.5rem - var(--safe-l) - var(--safe-r)));
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: color-mix(in srgb, var(--color-panel) 92%, transparent);
  padding: 0.9rem 0.95rem 0.8rem;
  color: var(--color-ink);
  box-shadow: var(--shadow-glass);
  backdrop-filter: blur(16px);
}
.graphics-settings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.graphics-settings__title {
  margin: 0;
  font-size: var(--text-reading);
  font-weight: 700;
}
.graphics-settings__fps {
  border-radius: 999px;
  background: rgb(46 160 90 / 0.18);
  padding: 0.1rem 0.45rem;
  color: #8ee0a8;
  font-size: 0.75rem;
  font-weight: 700;
}
.graphics-settings__fps.is-low {
  background: rgb(255 180 60 / 0.16);
  color: var(--color-warn-ink);
}
.graphics-settings__label {
  margin: 0.85rem 0 0.4rem;
  color: var(--color-ink-meta);
  font-size: var(--text-meta);
}
.graphics-settings__segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
}
.graphics-settings__segment button {
  min-height: 2.5rem;
  cursor: pointer;
  border: 1px solid var(--color-line);
  border-radius: 0.7rem;
  background: transparent;
  color: var(--color-ink-soft);
  font-size: var(--text-meta);
}
.graphics-settings__segment button.is-selected {
  border-color: transparent;
  background: #3a445c;
  color: var(--color-ink);
  font-weight: 700;
}
.graphics-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.graphics-settings__row-title {
  display: block;
  font-size: var(--text-reading);
  font-weight: 600;
}
.graphics-settings__row-hint {
  display: block;
  margin-top: 0.1rem;
  color: var(--color-ink-meta);
  font-size: var(--text-meta);
}
.graphics-settings__switch {
  position: relative;
  width: 2.6rem;
  height: 1.45rem;
  flex: none;
  cursor: pointer;
  appearance: none;
  border-radius: 999px;
  background: #2a3148;
  transition: background-color 0.15s ease;
}
.graphics-settings__switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: #fff;
  transition: transform 0.15s ease;
}
.graphics-settings__switch:checked {
  background: #5b8def;
}
.graphics-settings__switch:checked::after {
  transform: translateX(1.1rem);
}
.graphics-settings__switch:disabled {
  cursor: default;
  opacity: 0.7;
}
.graphics-settings__note {
  margin: 0.85rem 0 0;
  color: var(--color-ink-dim);
  font-size: var(--text-meta);
  line-height: 1.45;
}
</style>
