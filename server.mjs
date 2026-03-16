/**
 * Custom Astro standalone server entry point.
 *
 * Astro's node adapter serves prerendered (SSG) pages via a static-file handler
 * that runs BELOW the Astro middleware layer — so middleware response headers
 * (Cache-Control, X-Request-ID, etc.) are never applied to those responses.
 *
 * This wrapper intercepts every outgoing response at the raw Node.js http.ServerResponse
 * level, before any bytes are flushed, and forces the correct headers regardless of
 * whether the response came from the SSR pipeline or the static-file handler.
 *
 * Usage (set as the "start" script in package.json):
 *   node server.mjs
 */

import { handler, startServer } from "./dist/server/entry.mjs";
import http from "node:http";

const PORT = parseInt(process.env.PORT ?? "4321", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

// Headers to inject on EVERY response
const GLOBAL_HEADERS = {
  "X-Powered-By": "Astro on Contentstack Launch",
  "CDN-Cache-Control": "public, max-age=31536000",          // Cloudflare CDN-specific
  "Surrogate-Control": "max-age=31536000",                  // Varnish / other proxies
};

// Pages cache-control: browser 1 h, CDN 1 year
const PAGE_CACHE = "public, max-age=3600, s-maxage=31536000, must-revalidate";
// API routes: never cache
const API_NO_CACHE = "no-store";

function isApiPath(url = "") {
  return url.startsWith("/api/");
}

const server = http.createServer((req, res) => {
  // Patch writeHead so we can inject headers before they're sent
  const originalWriteHead = res.writeHead.bind(res);

  res.writeHead = function (statusCode, statusMessageOrHeaders, headers) {
    // Force Cache-Control on every response (overrides anything the static-file
    // handler or the Astro SSR layer may have already set)
    const cacheHeader = isApiPath(req.url) ? API_NO_CACHE : PAGE_CACHE;
    res.setHeader("Cache-Control", cacheHeader);

    // Inject the other global headers if not already present
    for (const [key, value] of Object.entries(GLOBAL_HEADERS)) {
      if (!res.getHeader(key)) res.setHeader(key, value);
    }

    // Pass through to the original writeHead
    if (typeof statusMessageOrHeaders === "string") {
      return originalWriteHead(statusCode, statusMessageOrHeaders, headers);
    }
    return originalWriteHead(statusCode, statusMessageOrHeaders);
  };

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`[server] Astro running at http://${HOST}:${PORT}`);
});
