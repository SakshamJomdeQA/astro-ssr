---
title: "Server-Side Rendering with Astro"
description: "Learn how to enable SSR in Astro for dynamic, personalized pages — including request handling, cookies, and environment variables."
pubDate: 2024-02-10
author: "Astro Team"
tags: ["astro", "ssr", "server", "node"]
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop"
featured: true
---

## SSR in Astro

While SSG is great for static content, **Server-Side Rendering (SSR)** is essential when you need:

- Personalised content per user
- Real-time data from APIs or databases
- Access to cookies and session state
- Responses that change per request (headers, query params, etc.)

## Enabling SSR

In `astro.config.mjs`, set `output` to `"server"` for full SSR, or `"hybrid"` to mix SSG + SSR:

```js
// astro.config.mjs
import node from "@astrojs/node";

export default defineConfig({
  output: "hybrid",   // or "server"
  adapter: node({ mode: "standalone" }),
});
```

The **adapter** tells Astro how to run the server. Adapters exist for:

- `@astrojs/node` — plain Node.js (Contentstack Launch, Railway, etc.)
- `@astrojs/netlify` — Netlify Functions
- `@astrojs/vercel` — Vercel Edge / Serverless
- `@astrojs/cloudflare` — Cloudflare Workers

## Opting In/Out of SSR per Page

With `hybrid` mode, pages are **SSG by default**. To make a page server-rendered:

```astro
---
export const prerender = false; // This page is now SSR

const url = Astro.url;
const userAgent = Astro.request.headers.get('user-agent');
---
<p>You are at: {url.pathname}</p>
<p>Your UA: {userAgent}</p>
```

To force a page to be static in `server` mode:

```astro
---
export const prerender = true; // opt into SSG
---
```

## Reading Request Data

SSR pages have full access to the incoming HTTP request:

```astro
---
export const prerender = false;

// Query params
const query = Astro.url.searchParams.get('q') ?? '';

// Headers
const acceptLang = Astro.request.headers.get('accept-language');

// Cookies
const theme = Astro.cookies.get('theme')?.value ?? 'dark';

// Set cookies
Astro.cookies.set('lastVisit', new Date().toISOString(), {
  httpOnly: true,
  maxAge: 60 * 60 * 24,
});
---
```

## Middleware

Astro middleware runs on **every request** before the page renders — perfect for:

- Authentication / authorization checks
- Logging and analytics
- Injecting shared data into `locals`

```ts
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.requestId = crypto.randomUUID();
  context.locals.startTime = Date.now();
  const response = await next();
  console.log(`[${context.locals.requestId}] ${context.url.pathname}`);
  return response;
});
```

## API Routes

Astro's file-based routing also supports **API endpoints** that return JSON or any response:

```ts
// src/pages/api/data.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const data = { message: "Hello from Astro API!", timestamp: Date.now() };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

## Deploying to Contentstack Launch

1. `npm run build` — produces `dist/` with `dist/server/entry.mjs`
2. Set `"start": "node dist/server/entry.mjs"` in `package.json`
3. Push to your Launch-connected Git repo — Launch detects the Node adapter automatically
4. Set environment variables in the Launch dashboard

> The `@astrojs/node` adapter in `standalone` mode bundles everything the server needs into `dist/`. No separate build step required.
