/**
 * Custom Astro standalone server entry point.
 *
 * Regular responses (HTML pages, JSON API) are always fully buffered before
 * sending — Content-Length is set, Transfer-Encoding: chunked is removed.
 * This makes the server compatible with Contentstack Launch regardless of
 * whether the platform's HTTP Streaming toggle is ON or OFF.
 *
 * SSE responses (Content-Type: text/event-stream) are detected automatically
 * and always streamed — buffering an infinite event stream is not possible.
 *
 * Cache-Control is enforced on every response:
 *   API routes  (/api/*)  → no-store
 *   Everything else       → public, max-age=3600, s-maxage=31536000, must-revalidate
 *
 * Usage:
 *   node server.mjs
 */

// Prevent the node adapter from auto-starting its own server on the same port.
// Must be set before the dynamic import so entry.mjs sees it at evaluation time.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

const { handler } = await import("./dist/server/entry.mjs");
import http from "node:http";

const PORT = parseInt(process.env.PORT ?? "4321", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const PAGE_CACHE   = "public, max-age=3600, s-maxage=31536000, must-revalidate";
const API_NO_CACHE = "no-store";

function isApiPath(url = "") {
  return url.startsWith("/api/");
}

// Headers applied to every response
const UNIVERSAL_HEADERS = {
  "X-Powered-By": "Astro on Contentstack Launch",
};

// CDN cache headers only belong on cacheable page responses
const PAGE_ONLY_HEADERS = {
  "CDN-Cache-Control": "public, max-age=31536000",
  "Surrogate-Control": "max-age=31536000",
};

function injectHeaders(req, res) {
  const isApi = isApiPath(req.url);
  res.setHeader("Cache-Control", isApi ? API_NO_CACHE : PAGE_CACHE);
  for (const [k, v] of Object.entries(UNIVERSAL_HEADERS)) {
    if (!res.getHeader(k)) res.setHeader(k, v);
  }
  if (!isApi) {
    for (const [k, v] of Object.entries(PAGE_ONLY_HEADERS)) {
      if (!res.getHeader(k)) res.setHeader(k, v);
    }
  }
}

function toBuffer(chunk, encoding) {
  if (!chunk) return null;
  if (Buffer.isBuffer(chunk)) return chunk;
  return Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
}

const server = http.createServer((req, res) => {
  // Disable Nagle's algorithm — flush each write() to the network immediately.
  // Needed for SSE so chunks reach the client without OS-level batching.
  if (req.socket) req.socket.setNoDelay(true);

  const chunks = [];
  let capturedStatus = 200;
  let isSSE = false;

  const origWriteHead = res.writeHead.bind(res);
  const origWrite     = res.write.bind(res);
  const origEnd       = res.end.bind(res);

  res.writeHead = function (status, msgOrHeaders, headersObj) {
    capturedStatus = status;

    // Absorb headers passed as writeHead() args into the setHeader queue.
    // Node.js gives writeHead-arg headers priority over setHeader values for
    // the same key; absorbing them first lets injectHeaders() always win.
    const extra =
      typeof msgOrHeaders === "object" && msgOrHeaders !== null
        ? msgOrHeaders
        : typeof headersObj  === "object" && headersObj  !== null
        ? headersObj
        : {};
    for (const [k, v] of Object.entries(extra)) {
      if (k.toLowerCase() !== "cache-control") res.setHeader(k, v);
    }

    // SSE must always stream — skip buffering for event-stream responses.
    const ct = String(res.getHeader("Content-Type") ?? "");
    if (ct.includes("text/event-stream")) {
      isSSE = true;
      injectHeaders(req, res);
      origWriteHead(capturedStatus);
      return res;
    }
  };

  res.write = function (chunk, encoding, callback) {
    if (isSSE) return origWrite(chunk, encoding, callback);
    const buf = toBuffer(chunk, encoding);
    if (buf) chunks.push(buf);
    if (typeof encoding === "function") encoding();
    else if (typeof callback === "function") callback();
    return true;
  };

  res.end = function (chunk, encoding, callback) {
    if (typeof chunk    === "function") { callback = chunk;    chunk = null; encoding = null; }
    else if (typeof encoding === "function") { callback = encoding; encoding = null; }

    if (isSSE) return origEnd(chunk, encoding, callback);

    const buf = toBuffer(chunk, encoding);
    if (buf) chunks.push(buf);

    const body = Buffer.concat(chunks);

    injectHeaders(req, res);
    res.setHeader("Content-Length", body.length);
    res.removeHeader("Transfer-Encoding");

    origWriteHead(capturedStatus);
    origEnd(body, callback);
    return res;
  };

  handler(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`[server] Astro running at http://${HOST}:${PORT}`);
});
