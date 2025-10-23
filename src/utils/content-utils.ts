import { getCollection } from "astro:content";

export async function getSortedPosts() {
  const allBlogPosts = await getCollection("blog", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  const sorted = allBlogPosts.sort((a, b) => {
    const dateA = new Date(a.data.pubDate);
    const dateB = new Date(b.data.pubDate);
    return dateA > dateB ? -1 : 1;
  });
  return sorted;
}
