import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import type { PostCategory } from "../../data/posts";
import { renderOgPng } from "../../utils/ogImage";

/**
 * One static PNG per post, linked from that post's `og:image`. The slug is
 * the content-collection id, so the URL stays `/og/<slug>.png`.
 */
export async function getStaticPaths() {
  const posts = await getCollection("posts");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      summary: post.data.summary,
      category: post.data.category,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgPng({
    title: props.title,
    summary: props.summary,
    category: props.category as PostCategory,
  });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
