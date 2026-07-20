/**
 * Translation lookup. `useTranslations(locale)` returns a typed `t()` that
 * resolves a `UiKey` for that locale and fills in `{name}` placeholders.
 *
 * Astro pages call it directly with `Astro.currentLocale`; the Vue island
 * shares one `t` through `provide`/`inject` (see `./vue`). Missing keys fall
 * back to the default locale so a not-yet-translated string degrades to the
 * source language instead of blanking out.
 */
import { DEFAULT_LOCALE, toLocale, type Locale } from "./config";
import { UI, type UiKey } from "./ui";

export type { Locale } from "./config";
export type { UiKey } from "./ui";

export type TranslateParams = Record<string, string | number>;

/** `(key, params?) => string`, bound to a single locale. */
export type TranslateFn = (key: UiKey, params?: TranslateParams) => string;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function useTranslations(locale: Locale = DEFAULT_LOCALE): TranslateFn {
  const table = UI[locale];
  const fallback = UI[DEFAULT_LOCALE];
  return (key, params) =>
    interpolate(table[key] ?? fallback[key] ?? key, params);
}

/** Convenience: narrow a raw string (e.g. `Astro.currentLocale`) and bind. */
export function useTranslationsFor(value: string | undefined): {
  locale: Locale;
  t: TranslateFn;
} {
  const locale = toLocale(value);
  return { locale, t: useTranslations(locale) };
}
