import rss from "@astrojs/rss";
import { getSortedPosts } from "../utils/content-utils";

export async function GET(context) {
  const posts = await getSortedPosts();
  return rss({
    title: "Anurag Mishra",
    description: "A space on the web where I share whatever I feel like",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/writing/${post.id}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
