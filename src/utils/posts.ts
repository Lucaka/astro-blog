/**
 * Helpers shared by the index page, the static post pages, the RSS feed and
 * the client island (which uses `postPath` for pushState deep links).
 */
import type { TranslateFn } from "../i18n";
import { DEFAULT_LOCALE, type Locale } from "../i18n/config";

/**
 * URL path prefix for a locale: empty for the prefix-less default (`zh-hant`),
 * `/en` for the rest. Kept framework-agnostic (no `astro:i18n`) so the client
 * island can build the same links it does on the server.
 */
export function localePrefix(locale: Locale = DEFAULT_LOCALE): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/** Parse the display date ("2025.04" or "2025.04.16") into a real Date. */
export function parseDisplayDate(display: string): Date {
  const [year, month = "1", day = "1"] = display.split(".");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Estimated reading time in whole minutes from raw Markdown. CJK is counted
 * per character (~300 chars/min), everything else per word (~200 words/min).
 */
export function readingTimeMinutes(markdown: string): number {
  const cjk = markdown.match(/[一-鿿㐀-䶿]/g)?.length ?? 0;
  const words =
    markdown
      .replace(/[一-鿿㐀-䶿]/g, " ")
      .match(/[A-Za-z0-9_'-]+/g)?.length ?? 0;
  return Math.max(1, Math.round(cjk / 300 + words / 200));
}

/**
 * Newest-first comparator for content-collection entries, comparing parsed
 * dates rather than raw strings so an unpadded month ("2025.4") still sorts
 * correctly. Shared by the index, post nav, 404 and RSS orderings.
 */
export function byDateDesc(
  a: { data: { date: string } },
  b: { data: { date: string } },
): number {
  return parseDisplayDate(b.data.date).getTime() - parseDisplayDate(a.data.date).getTime();
}

/** "2025.04 · 約 5 分鐘" meta line shown in tooltips, the sidebar and panel. */
export function postMeta(
  post: { date: string; minutes?: number },
  t: TranslateFn,
): string {
  return post.minutes
    ? `${post.date} · ${t("post.readingTime", { minutes: post.minutes })}`
    : post.date;
}

/** Site-relative path of a post page, respecting the base and the locale. */
export function postPath(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${localePrefix(locale)}/posts/${slug}/`;
}
