import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Site URL — update this to your Contentstack Launch URL before deploying
  site: "https://your-launch-app.contentstack.com",

  // Use root-level directories instead of src/ — pages/, components/, layouts/, etc.
  srcDir: "./",

  // Static by default (SSG); pages/routes with `export const prerender = false` become SSR.
  // In Astro v5, "hybrid" mode was merged into "static" — the adapter enables per-page SSR opt-in.
  output: "static",

  adapter: node({
    mode: "standalone",
  }),

  integrations: [
    react(),
    sitemap(),
  ],

  // Image optimization settings
  image: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
});
