<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "../i18n/vue";

// Shared glassmorphism modal shell. Owns everything the reading panel and the
// info guide had in common: the fixed scrim, the frosted card, the × close
// affordance, the open/close transition, and the modal a11y (focus-on-open,
// focus trap, Esc to close, focus restore, click-scrim-to-close). Consumers
// drop their content into the default slot; the two panels differ only by
// `align` (docked-right vs centered) and their inner content.
const props = withDefaults(
  defineProps<{
    open: boolean;
    /** aria-label for the dialog. */
    label: string;
    /** Desktop placement: a centered card, or one docked to the right edge. */
    align?: "center" | "end";
    /** Card element tag — semantic only (e.g. "article" for the reading panel). */
    tag?: string;
    /** aria-label for the × close button; defaults to the localized "Close". */
    closeLabel?: string;
    /** Reading card: opaque enough (about 80%) that body text stays solid. */
    solid?: boolean;
  }>(),
  { align: "center", tag: "section", solid: false },
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

const t = useI18n();
// Callers usually pass their own (e.g. "關閉文章"); fall back to a plain
// localized "關閉" when they don't.
const closeAriaLabel = () => props.closeLabel ?? t("panel.close");

// `align` is fixed per call site, so a plain computed-once string is enough.
const scrimClass =
  "fixed inset-0 z-30 flex items-center p-[clamp(16px,4vw,48px)] max-sm:p-0 " +
  // Clear the fixed language switch in the top-right corner.
  "sm:pt-[max(5.75rem,clamp(16px,4vw,48px))] " +
  (props.align === "end"
    ? "justify-end max-sm:items-stretch max-sm:justify-stretch"
    : "justify-center");

// `glass-panel` is a marker the <Transition> CSS targets; the rest is chrome.
// Kept as a grouped const (not a sorted inline string) because it's long and
// carries a per-variant size branch — see ReadingPanel's note on this pattern.
const panelClass = [
  "glass-panel relative overflow-y-auto rounded-[20px] border border-line",
  "px-[30px] py-8 pr-16 text-ink shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-lg",
  props.solid ? "bg-panel/80" : "bg-panel/55",
  // Mobile: full-bleed sheet. Reading stays near 80% so type doesn't pick up bloom.
  "max-sm:h-dvh max-sm:max-w-full max-sm:rounded-none max-sm:border-x-0",
  props.solid ? "max-sm:bg-panel-deep/80" : "max-sm:bg-panel-deep/72",
  "max-sm:px-[calc(1.25rem+var(--safe-l))] max-sm:pt-[calc(1.75rem+var(--safe-t))]",
  "max-sm:pb-[calc(2.5rem+var(--safe-b))] max-sm:pr-[calc(3.5rem+var(--safe-r))]",
  // Docked-right (reading) card is wider/taller and becomes a full sheet on
  // mobile; the centered (guide) card stays a fixed-width centered card.
  props.align === "end"
    ? "max-h-[min(84vh,calc(100dvh-9.5rem))] w-[min(440px,92vw)] max-sm:max-h-none max-sm:w-full"
    : "max-h-[min(80vh,calc(100dvh-9.5rem))] w-[min(400px,92vw)]",
].join(" ");

const closeClass =
  "absolute top-3 right-3 inline-flex size-11 cursor-pointer items-center " +
  "justify-center rounded-lg bg-fill text-xl leading-none text-ink " +
  "transition-colors duration-150 hover:bg-fill-strong focus-visible:bg-fill-strong " +
  "max-sm:top-[calc(0.75rem+var(--safe-t))] max-sm:right-[calc(0.75rem+var(--safe-r))]";

// --- Modal accessibility: focus management + trap + Esc --------------------
const panelEl = ref<HTMLElement | null>(null);
let lastFocused: HTMLElement | null = null;
watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastFocused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await nextTick();
      panelEl.value?.focus();
    } else if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  },
);

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab" || !panelEl.value) return;
  const focusables = panelEl.value.querySelectorAll<HTMLElement>(
    'button, a[href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panelEl.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <Transition name="panel-fade">
    <div
      v-if="open"
      :class="scrimClass"
      @click.self="emit('close')"
      @keydown="handleKeydown"
    >
      <component
        :is="tag"
        ref="panelEl"
        :class="panelClass"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
      >
        <button
          :class="closeClass"
          :aria-label="closeAriaLabel()"
          @click="emit('close')"
        >
          ×
        </button>
        <slot />
      </component>
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
.panel-fade-enter-active .glass-panel,
.panel-fade-leave-active .glass-panel {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
.panel-fade-enter-from .glass-panel,
.panel-fade-leave-to .glass-panel {
  transform: translateX(24px);
  opacity: 0;
}

/* Reduced motion: keep the UI transitions near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .panel-fade-enter-active,
  .panel-fade-leave-active,
  .panel-fade-enter-active .glass-panel,
  .panel-fade-leave-active .glass-panel {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}

/* Mobile: the card slides up from below instead of in from the right. */
@media (max-width: 640px) {
  .panel-fade-enter-from .glass-panel,
  .panel-fade-leave-to .glass-panel {
    transform: translateY(24px);
  }
}
</style>
