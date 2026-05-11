/**
 * Custom Astro standalone server entry point.
 *
 * Astro's node adapter (standalone mode) auto-starts its own HTTP server on the
 * same port when entry.mjs is loaded.  That server has no writeHead patch, so
 * requests it serves bypass all our Cache-Control / header injection.
 *
 * Setting ASTRO_NODE_AUTOSTART=disabled before the dynamic import() prevents the
 * adapter from starting its own server, leaving our custom server as the sole
 * listener.  This must be done via dynamic import (not static) so the env var is
 * in place before entry.mjs is evaluated.
 *
 * Modes (set via env var):
 *   STREAMING_DISABLED=true  → buffer the full response body before sending.
 *                              Useful when the hosting proxy doesn't support
 *                              chunked transfer / HTTP streaming. Cache-Control
 *                              and all other headers are still correctly applied.
 *   (default)                → streaming mode; headers are injected just before
 *                              writeHead fires, body chunks flow through as-is.
 *
 * Usage (set as the "start" script in package.json):
 *   node server.mjs
 *   STREAMING_DISABLED=true node server.mjs
 */

// Must be set BEFORE the dynamic import so entry.mjs sees it during evaluation.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

const { handler } = await import("./dist/server/entry.mjs");
import http from "node:http";

const PORT = parseInt(process.env.PORT ?? "4321", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

// Set to "true" to buffer the full response before sending.
const STREAMING_DISABLED = process.env.STREAMING_DISABLED === "true";

// Headers injected on every response
const GLOBAL_HEADERS = {
  "X-Powered-By": "Astro on Contentstack Launch",
  "X-Streaming-Mode": STREAMING_DISABLED ? "buffer" : "stream",
  "CDN-Cache-Control": "public, max-age=31536000",
  "Surrogate-Control": "max-age=31536000",
};

const PAGE_CACHE = "public, max-age=3600, s-maxage=31536000, must-revalidate";
const API_NO_CACHE = "no-store";

function isApiPath(url = "") {
  return url.startsWith("/api/");
}

/**
 * Inject Cache-Control and global headers onto res.
 * Cache-Control is always overridden; other globals are set only if absent.
 */
function injectHeaders(req, res) {
  res.setHeader("Cache-Control", isApiPath(req.url) ? API_NO_CACHE : PAGE_CACHE);
  for (const [key, value] of Object.entries(GLOBAL_HEADERS)) {
    if (!res.getHeader(key)) res.setHeader(key, value);
  }
}

/**
 * Normalise a chunk argument into a Buffer.
 */
function toBuffer(chunk, encoding) {
  if (!chunk) return null;
  if (Buffer.isBuffer(chunk)) return chunk;
  return Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
}

const server = http.createServer((req, res) => {
  if (STREAMING_DISABLED) {
    // ── Buffer mode ────────────────────────────────────────────────────────
    // Collect every write() call into an in-memory array.  Once end() fires,
    // inject headers, set Content-Length, and flush the whole response at once.
    // This guarantees Cache-Control (and friends) are always present even if
    // the upstream proxy doesn't forward chunked-transfer headers.
    //
    // SSE / EventStream responses are detected at writeHead time and allowed
    // to pass through without buffering (they are infinite / long-lived).

    const chunks = [];
    let capturedStatus = 200;
    let isSSE = false;

    const origWriteHead = res.writeHead.bind(res);
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.writeHead = function (status, msgOrHeaders, headersObj) {
      capturedStatus = status;

      // Absorb any headers passed directly to writeHead() — they would normally
      // override setHeader values, so we move them into the setHeader queue
      // (except cache-control which we always enforce ourselves).
      const extra =
        typeof msgOrHeaders === "object" && msgOrHeaders !== null
          ? msgOrHeaders
          : typeof headersObj === "object" && headersObj !== null
          ? headersObj
          : {};
      for (const [k, v] of Object.entries(extra)) {
        if (k.toLowerCase() !== "cache-control") res.setHeader(k, v);
      }

      // Detect Server-Sent Events / long-lived streams — can't buffer those.
      const ct = String(res.getHeader("Content-Type") ?? "");
      if (ct.includes("text/event-stream")) {
        isSSE = true;
        injectHeaders(req, res);
        origWriteHead(capturedStatus);
        return res;
      }
    };

    res.write = function (chunk, encoding, callback) {
      // Once SSE mode is detected, pass writes straight through.
      if (isSSE) return origWrite(chunk, encoding, callback);

      const buf = toBuffer(chunk, encoding);
      if (buf) chunks.push(buf);

      // Fire the callback (write is always "accepted" in buffer mode).
      if (typeof encoding === "function") encoding();
      else if (typeof callback === "function") callback();

      return true;
    };

    res.end = function (chunk, encoding, callback) {
      // Normalise callback-only signature: end(cb)
      if (typeof chunk === "function") {
        callback = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        callback = encoding;
        encoding = null;
      }

      // SSE: just pass through as-is.
      if (isSSE) return origEnd(chunk, encoding, callback);

      const buf = toBuffer(chunk, encoding);
      if (buf) chunks.push(buf);

      const body = Buffer.concat(chunks);

      // Inject Cache-Control and globals, then set Content-Length and strip
      // any Transfer-Encoding: chunked that the adapter may have queued.
      injectHeaders(req, res);
      res.setHeader("Content-Length", body.length);
      res.removeHeader("Transfer-Encoding");

      // Now send the full response in one shot.
      origWriteHead(capturedStatus);
      origEnd(body, callback);
      return res;
    };
  } else {
    // ── Streaming mode ─────────────────────────────────────────────────────
    // Patch writeHead so headers are injected just before they're flushed.
    // The response body streams through in chunks without any buffering.

    const origWriteHead = res.writeHead.bind(res);

    res.writeHead = function (statusCode, statusMessageOrHeaders, headersArg) {
      // Move any headers passed directly to writeHead() into the setHeader queue
      // (excluding cache-control — we always enforce our own value).
      // Node.js gives writeHead-arg headers priority over setHeader values for
      // the same key, so by absorbing them into setHeader first we avoid that.
      const extra =
        typeof statusMessageOrHeaders === "object" && statusMessageOrHeaders !== null
          ? statusMessageOrHeaders
          : typeof headersArg === "object" && headersArg !== null
          ? headersArg
          : {};
      for (const [k, v] of Object.entries(extra)) {
        if (k.toLowerCase() !== "cache-control") res.setHeader(k, v);
      }

      // Inject our Cache-Control (last setHeader wins for the same key).
      injectHeaders(req, res);

      // Call the real writeHead with NO headers arg so Node.js uses setHeader values only.
      const msg = typeof statusMessageOrHeaders === "string" ? statusMessageOrHeaders : undefined;
      return msg ? origWriteHead(statusCode, msg) : origWriteHead(statusCode);
    };
  }

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  const mode = STREAMING_DISABLED ? "buffer" : "streaming";
  console.log(`[server] Astro running at http://${HOST}:${PORT} (mode: ${mode})`);
});
