// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeExternalLinks from "rehype-external-links";

import sitemap from "@astrojs/sitemap";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  site: "https://theanuragmishra.github.io",
  integrations: [
    sitemap(),
    expressiveCode({
      defaultProps: {
        wrap: true,
      },
      styleOverrides: {
        codeFontFamily: "'JetBrains Mono Variable', monospace",
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        { target: "_blank", rel: ["noopener", "noreferrer"] },
      ],
    ],
  },
});
