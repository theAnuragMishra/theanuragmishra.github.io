// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import expressiveCode from "astro-expressive-code";
import remarkDirective from "remark-directive";
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
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
    remarkPlugins: [remarkDirective, remarkGithubAdmonitionsToDirectives],
  },
});
