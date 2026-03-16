import { defineMiddleware } from "astro:middleware";

// Extend App.Locals via the type definition in env.d.ts
export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Attach shared data to locals — accessible in all SSR pages & API routes
  context.locals.requestId = requestId;
  context.locals.startTime = startTime;

  // Derive a simple "visitor id" from the IP header (demo — not production auth)
  const ip =
    context.request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    context.request.headers.get("x-real-ip") ??
    "unknown";
  context.locals.visitorIp = ip;

  // Theme preference from cookie (with fallback)
  const theme = context.cookies.get("theme")?.value ?? "dark";
  context.locals.theme = theme;

  // Simple demo "auth" — check for a Bearer token header
  const authHeader = context.request.headers.get("authorization") ?? "";
  context.locals.isAuthenticated = authHeader.startsWith("Bearer demo-token-123");

  // Call the next middleware / page handler
  const response = await next();

  // Add custom response headers (useful for debugging on Contentstack Launch)
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  response.headers.set("X-Powered-By", "Astro on Contentstack Launch");

  // Log to console (visible in Launch's log stream)
  const method = context.request.method;
  const path = context.url.pathname;
  const status = response.status;
  const duration = Date.now() - startTime;
  console.log(`[${requestId.slice(0, 8)}] ${method} ${path} → ${status} (${duration}ms)`);

  return response;
});
