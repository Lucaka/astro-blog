/**
 * Tag helpers shared by the static post pages (clickable tags), the per-tag
 * index pages under `/tags/[tag]/` and the tag directory at `/tags/`.
 *
 * Tags live in post frontmatter as free-form strings ("Vue.js", "HTML
 * attribute", "語言代碼"), so we derive a stable, URL-safe slug from each and
 * build every tag URL through `tagPath` — never hardcoding the base. URLs are
 * locale-aware: prefix-less for the default `zh-hant`, `/en/…` for the rest.
 */
import { DEFAULT_LOCALE, type Locale } from "../i18n/config";
import { localePrefix } from "./posts";

/** URL-safe slug for a tag. Lowercases, drops parens, collapses separators. */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[.\s/]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Site-relative path of a tag page, respecting the base and the locale. */
export function tagPath(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${localePrefix(locale)}/tags/${slug}/`;
}

/** Site-relative path of the tag directory (`/tags/`), per locale. */
export function tagsIndexPath(locale: Locale = DEFAULT_LOCALE): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${localePrefix(locale)}/tags/`;
}
