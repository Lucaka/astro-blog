/**
 * Shared RSS builder for both locales. `/rss.xml` (zh-hant) and `/en/rss.xml`
 * call this with their locale; the channel link, item links, title/description
 * and `<language>` all follow it. Post content isn't translated yet, so item
 * titles/summaries stay in the source language under either feed.
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { byDateDesc, parseDisplayDate, postPath, localePrefix } from "./posts";
import { useTranslations } from "../i18n";
import { LOCALE_META, type Locale } from "../i18n/config";

export async function buildFeed(context: APIContext, locale: Locale) {
  const entries = await getCollection("posts");
  entries.sort(byDateDesc);

  const t = useTranslations(locale);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return rss({
    title: t("site.name"),
    description: t("rss.description"),
    // Channel link points at this locale's blog home (site + base + prefix),
    // not the bare domain root.
    site: new URL(`${base}${localePrefix(locale)}/`, context.site).href,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: parseDisplayDate(entry.data.date),
      categories: [entry.data.category, ...entry.data.tags],
      link: postPath(entry.id, locale),
    })),
    customData: `<language>${LOCALE_META[locale].htmlLang}</language>`,
  });
}
