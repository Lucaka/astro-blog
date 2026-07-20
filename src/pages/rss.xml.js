import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { byDateDesc, parseDisplayDate, postPath } from "../utils/posts";
import { useTranslationsFor } from "../i18n";
import { LOCALE_META } from "../i18n/config";

export async function GET(context) {
  const entries = await getCollection("posts");
  entries.sort(byDateDesc);

  const { locale, t } = useTranslationsFor(context.currentLocale);

  return rss({
    title: t("site.name"),
    description: t("rss.description"),
    // Channel link should point at the blog itself (site + base), not the
    // bare domain root.
    site: new URL(import.meta.env.BASE_URL, context.site).href,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: parseDisplayDate(entry.data.date),
      categories: [entry.data.category, ...entry.data.tags],
      link: postPath(entry.id),
    })),
    customData: `<language>${LOCALE_META[locale].htmlLang}</language>`,
  });
}
