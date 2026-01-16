// Import the glob loader
import { glob } from "astro/loaders";
// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// Define a `loader` and `schema` for each collection
const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string().optional(),
      cover: z
        .object({
          url: image(),
          alt: z.string(),
        })
        .optional(),
      category: z.string().optional(),
      draft: z.boolean(),
    }),
});
// Export a single `collections` object to register your collection(s)
export const collections = { posts };
