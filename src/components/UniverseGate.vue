<script setup lang="ts">
import { computed } from "vue";
import type { QualityId } from "../utils/graphics";
import { useI18n } from "../i18n/vue";

const props = defineProps<{
  progress: number;
  stage: string;
  quality: QualityId;
  detected: QualityId;
  ready: boolean;
}>();

const emit = defineEmits<{
  (e: "enter"): void;
  (e: "fallback"): void;
  (e: "quality", id: QualityId): void;
}>();

const t = useI18n();

const options: QualityId[] = ["high", "balanced", "saver"];

const detectedLabel = computed(() => {
  if (props.detected === "high") return t("gate.quality.high");
  if (props.detected === "saver") return t("gate.quality.saver");
  return t("gate.quality.balanced");
});

function body(id: QualityId) {
  if (id === "high") return t("gate.quality.highBody");
  if (id === "saver") return t("gate.quality.saverBody");
  return t("gate.quality.balancedBody");
}
function title(id: QualityId) {
  if (id === "high") return t("gate.quality.high");
  if (id === "saver") return t("gate.quality.saver");
  return t("gate.quality.balanced");
}
</script>

<template>
  <div
    class="universe-gate"
    role="dialog"
    aria-modal="true"
    :aria-label="t('gate.brand')"
  >
    <div class="universe-gate__planet" aria-hidden="true">
      <span class="universe-gate__ring"></span>
      <span class="universe-gate__orb"></span>
    </div>
    <h1 class="universe-gate__brand">{{ t("gate.brand") }}</h1>
    <p class="universe-gate__stage">{{ stage || t("gate.stage.boot") }}</p>
    <div
      class="universe-gate__bar"
      role="progressbar"
      :aria-valuenow="Math.round(progress)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        class="universe-gate__bar-fill"
        :style="{ width: `${Math.min(100, progress)}%` }"
      ></span>
    </div>
    <p class="universe-gate__percent">{{ Math.round(progress) }}%</p>

    <div
      class="universe-gate__options"
      role="radiogroup"
      :aria-label="t('settings.quality')"
    >
      <button
        v-for="id in options"
        :key="id"
        type="button"
        class="universe-gate__option"
        :class="{ 'is-selected': quality === id }"
        role="radio"
        :aria-checked="quality === id"
        @click="emit('quality', id)"
      >
        <span class="universe-gate__option-head">
          <span class="universe-gate__radio" aria-hidden="true"></span>
          <span class="universe-gate__option-title">{{ title(id) }}</span>
          <span v-if="id === 'balanced'" class="universe-gate__badge">{{
            t("gate.recommended")
          }}</span>
        </span>
        <span class="universe-gate__option-body">{{ body(id) }}</span>
      </button>
    </div>

    <p class="universe-gate__auto">
      <span class="universe-gate__auto-pill">{{ t("gate.auto") }}</span>
      {{ t("gate.autoChosen", { quality: detectedLabel }) }}
    </p>

    <button
      type="button"
      class="universe-gate__enter"
      :disabled="!ready"
      @click="emit('enter')"
    >
      {{ t("gate.enter") }}
    </button>
    <button type="button" class="universe-gate__list" @click="emit('fallback')">
      {{ t("gate.list") }}
    </button>
  </div>
</template>

<style scoped>
.universe-gate {
  position: fixed;
  inset: 0;
  z-index: 15;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(4.5rem + var(--safe-t)) 1.25rem calc(1.5rem + var(--safe-b));
  overflow: auto;
  background:
    radial-gradient(ellipse at 50% 28%, rgb(40 48 82 / 0.45), transparent 42%),
    radial-gradient(ellipse at 50% 38%, #101628 0%, #070910 55%, #000 100%);
  color: var(--color-ink);
  text-align: center;
}
.universe-gate__planet {
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  margin-bottom: 0.75rem;
}
.universe-gate__orb {
  position: absolute;
  inset: 1.35rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 35% 35%,
    #ffd7a1,
    #f08a2a 45%,
    #c2410c 78%
  );
  box-shadow: 0 0 32px rgb(255 150 50 / 0.45);
}
.universe-gate__ring {
  position: absolute;
  inset: 1.6rem -0.4rem;
  border: 1.5px solid rgb(255 196 120 / 0.7);
  border-radius: 50%;
  transform: rotate(-18deg) scaleY(0.38);
}
.universe-gate__brand {
  margin: 0;
  font-size: var(--text-card-title);
  font-weight: 700;
  letter-spacing: 0.02em;
}
.universe-gate__stage {
  margin: 0.35rem 0 0.85rem;
  color: var(--color-ink-meta);
  font-size: var(--text-reading);
}
.universe-gate__bar {
  width: min(22rem, 100%);
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}
.universe-gate__bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #7eb6ff, #d7e6ff);
}
.universe-gate__percent {
  margin: 0.45rem 0 1.1rem;
  color: var(--color-ink-meta);
  font-size: var(--text-meta);
}
.universe-gate__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 16rem));
  gap: 0.75rem;
  width: min(52rem, 100%);
}
.universe-gate__option {
  display: flex;
  min-height: 7.5rem;
  cursor: pointer;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.9rem 0.95rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: rgb(12 16 28 / 0.72);
  color: inherit;
  text-align: left;
}
.universe-gate__option.is-selected {
  border-color: #8ab4ff;
  box-shadow: inset 0 0 0 1px #8ab4ff;
}
.universe-gate__option-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.universe-gate__radio {
  width: 1rem;
  height: 1rem;
  flex: none;
  border: 1.5px solid var(--color-ink-meta);
  border-radius: 999px;
}
.is-selected .universe-gate__radio {
  border: 5px solid #8ab4ff;
}
.universe-gate__option-title {
  font-size: var(--text-reading);
  font-weight: 700;
}
.universe-gate__badge {
  margin-left: auto;
  border-radius: 999px;
  background: #3b82f6;
  padding: 0.05rem 0.4rem;
  color: #fff;
  font-size: 0.75rem;
}
.universe-gate__option-body {
  color: var(--color-ink-meta);
  font-size: var(--text-meta);
  line-height: 1.45;
}
.universe-gate__auto {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.9rem 0 1rem;
  color: var(--color-ink-meta);
  font-size: var(--text-meta);
}
.universe-gate__auto-pill {
  border-radius: 999px;
  background: rgb(59 130 246 / 0.18);
  padding: 0.15rem 0.55rem;
  color: var(--color-accent-strong);
}
.universe-gate__enter {
  min-width: min(22rem, 100%);
  min-height: 3rem;
  cursor: pointer;
  border: 0;
  border-radius: 999px;
  background: #5b8def;
  color: #fff;
  font-size: var(--text-body);
  font-weight: 700;
}
.universe-gate__enter:disabled {
  cursor: default;
  opacity: 0.55;
}
.universe-gate__list {
  margin-top: 0.85rem;
  cursor: pointer;
  border: 0;
  background: none;
  color: var(--color-ink-soft);
  font-size: var(--text-meta);
  text-decoration: underline;
  text-underline-offset: 3px;
}
@media (max-width: 800px) {
  .universe-gate__options {
    grid-template-columns: 1fr;
    width: min(28rem, 100%);
  }
  .universe-gate__option {
    min-height: 0;
  }
  .universe-gate__planet {
    width: 5.5rem;
    height: 5.5rem;
  }
}
</style>
