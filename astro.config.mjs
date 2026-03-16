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

  // "server" mode: ALL requests go through the Astro SSR pipeline → middleware runs on everything.
  // Pages with `export const prerender = true` are still built as static HTML at build time,
  // but the node standalone server routes every request through the middleware chain first,
  // so Cache-Control and other response headers are applied uniformly.
  // (With output:"static", the static file handler runs BELOW the middleware layer,
  //  so middleware headers are silently dropped for prerendered pages.)
  output: "server",

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
