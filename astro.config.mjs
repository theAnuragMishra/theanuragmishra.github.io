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
  site: "https://anurag-mishra.netlify.app",
  integrations: [sitemap(), expressiveCode()],
  markdown: {
    remarkPlugins: [remarkDirective, remarkGithubAdmonitionsToDirectives],
  },
});
