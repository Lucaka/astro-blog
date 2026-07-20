/**
 * Locale registry for the universe. The site ships Traditional Chinese
 * (`zh-hant`) as the default locale — its URLs carry no prefix, so every
 * existing link, feed and indexed page stays exactly where it was — with
 * English (`en`) served under `/en/`.
 *
 * This module holds only locale *identity* (which locales exist, their
 * default, and the per-locale document metadata). The translated UI strings
 * live in `ui.ts`; the lookup helper lives in `index.ts`.
 */

/** Every locale the site knows about. Codes are lower-case, Astro-style. */
export const LOCALES = ["zh-hant", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** The prefix-less default locale (unchanged URLs, unchanged SEO). */
export const DEFAULT_LOCALE: Locale = "zh-hant";

/**
 * Per-locale document metadata: the BCP-47 tag for `<html lang>`, the
 * OpenGraph locale, and the self-referential label shown in a language
 * switcher. Kept separate from the locale *code* so the code can stay
 * lower-case (Astro's routing convention) while the markup still emits the
 * canonical casing (`zh-Hant`).
 */
export const LOCALE_META: Record<
  Locale,
  { htmlLang: string; ogLocale: string; label: string }
> = {
  "zh-hant": { htmlLang: "zh-Hant", ogLocale: "zh_TW", label: "繁體中文" },
  en: { htmlLang: "en", ogLocale: "en_US", label: "English" },
};

/** Narrow an unknown value (e.g. `Astro.currentLocale`) to a known `Locale`. */
export function toLocale(value: string | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}
