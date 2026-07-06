<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

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
    /** aria-label for the × close button. */
    closeLabel?: string;
  }>(),
  { align: "center", tag: "section", closeLabel: "關閉" },
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

// `align` is fixed per call site, so a plain computed-once string is enough.
const scrimClass =
  "fixed inset-0 z-30 flex items-center p-[clamp(16px,4vw,48px)] max-sm:p-0 " +
  (props.align === "end"
    ? "justify-end max-sm:items-stretch max-sm:justify-stretch"
    : "justify-center");

// `glass-panel` is a marker the <Transition> CSS targets; the rest is chrome.
// Kept as a grouped const (not a sorted inline string) because it's long and
// carries a per-variant size branch — see ReadingPanel's note on this pattern.
const panelClass = [
  "glass-panel relative overflow-y-auto rounded-[20px] border border-white/12",
  "bg-[#0e121e]/45 px-[30px] py-8 text-ink shadow-[0_8px_40px_rgba(0,0,0,0.25)]",
  "backdrop-blur-lg focus:outline-none",
  // Mobile: darker fill and square corners over the bright bloom ring.
  "max-sm:h-dvh max-sm:rounded-none max-sm:border-x-0 max-sm:bg-[#0a0d16]/72",
  "max-sm:px-[22px] max-sm:pt-7 max-sm:pb-10",
  // Docked-right (reading) card is wider/taller and becomes a full sheet on
  // mobile; the centered (guide) card stays a fixed-width centered card.
  props.align === "end"
    ? "max-h-[84vh] w-[min(440px,92vw)] max-sm:max-h-none max-sm:w-screen"
    : "max-h-[80vh] w-[min(400px,92vw)]",
].join(" ");

const closeClass =
  "absolute top-3.5 right-4 size-8 cursor-pointer rounded-lg bg-white/6 " +
  "text-xl leading-none text-[#cdd6f4] transition-colors duration-150 " +
  "hover:bg-white/14 focus-visible:bg-white/14";

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
        <button :class="closeClass" :aria-label="closeLabel" @click="emit('close')">
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
