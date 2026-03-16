import { defineMiddleware } from "astro:middleware";

// Extend App.Locals via the type definition in env.d.ts
export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Safe to set in ALL contexts (SSG prerendering + SSR runtime)
  context.locals.requestId = requestId;
  context.locals.startTime = startTime;

  // Set safe defaults — no request.headers or cookies access here.
  // Astro's prerendering interceptor fires a WARN on ANY request-level read
  // (headers, cookies, method) during SSG page rendering.
  // SSR pages read Astro.cookies / Astro.request.headers directly.
  context.locals.theme = "dark";
  context.locals.visitorIp = "unknown";
  context.locals.isAuthenticated = false;

  const response = await next();

  // Outgoing response headers — safe to set after next() in all contexts
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  response.headers.set("X-Powered-By", "Astro on Contentstack Launch");

  // Cache-Control applied to every page and route:
  //   API routes  → no-store  (always fresh, never cached)
  //   All pages   → browser caches 1 hour, CDN caches 1 year
  const isApiRoute = context.url.pathname.startsWith("/api/");
  response.headers.set(
    "Cache-Control",
    isApiRoute
      ? "no-store"
      : "public, max-age=3600, s-maxage=31536000, must-revalidate"
  );

  // Visible in Contentstack Launch's log stream
  const status = response.status;
  const duration = Date.now() - startTime;
  console.log(
    `[${requestId.slice(0, 8)}] ${context.request.method} ${context.url.pathname} → ${status} (${duration}ms)`
  );

  return response;
});
