import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { byDateDesc, parseDisplayDate, postPath } from "../utils/posts";

export async function GET(context) {
  const entries = await getCollection("posts");
  entries.sort(byDateDesc);

  return rss({
    title: "James Universe",
    description: "在宇宙裡探索的部落格：前端、圖學與隨筆。",
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
    customData: "<language>zh-Hant</language>",
  });
}
