/**
 * Vue-side i18n plumbing for the 3D island. The island is `client:only`, so
 * SSR never renders it; `index.astro` hands the active locale in as a prop and
 * `<BlackHole>` calls `provideI18n(locale)` once. Every descendant then pulls
 * the shared `t()` via `useI18n()` — no per-component locale threading.
 *
 * If we ever want ICU plurals/formatting inside the island, swap the body of
 * `provideI18n` for `createI18n(...)` from `vue-i18n`; the dictionary in
 * `ui.ts` is already shaped as `messages`, and `useI18n()` stays the seam.
 */
import { inject, provide, type InjectionKey } from "vue";
import { useTranslations, type Locale, type TranslateFn } from "./index";

const I18N_KEY: InjectionKey<TranslateFn> = Symbol("i18n.t");

/** Called once at the island root. Provides a locale-bound `t` to children. */
export function provideI18n(locale: Locale): TranslateFn {
  const t = useTranslations(locale);
  provide(I18N_KEY, t);
  return t;
}

/** Grab the island's shared `t`. Falls back to the default locale off-tree. */
export function useI18n(): TranslateFn {
  return inject(I18N_KEY, useTranslations());
}
