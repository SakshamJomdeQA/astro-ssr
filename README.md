# Astro Feature Showcase

A comprehensive **Astro v5** application demonstrating every major framework feature, ready to deploy on **Contentstack Launch**.

## Features Demonstrated

| Feature | Route | Mode |
|---|---|---|
| Static Site Generation (SSG) | `/`, `/features`, `/about`, `/islands` | SSG |
| Content Collections + MDX | `/blog`, `/blog/[slug]` | SSG |
| Server-Side Rendering (SSR) | `/ssr`, `/ssr/user/[id]` | SSR |
| API Routes (GET/POST) | `/api/hello`, `/api/time`, `/api/echo` | SSR |
| React Islands (partial hydration) | `/islands` | SSG + Islands |
| Middleware (locals, headers, auth) | Every request | Middleware |
| API Demo (interactive) | `/api-demo` | SSR + Island |
| Middleware Demo | `/middleware-demo` | SSR |
| View Transitions | All pages | SSG |
| Image Optimization | `/features#images` | SSG |
| Sitemap | `/sitemap-index.xml` | SSG |

## Tech Stack

- **Framework:** [Astro v5](https://astro.build)
- **Adapter:** `@astrojs/node` (standalone mode)
- **UI:** React 19 (Islands only)
- **Content:** Markdown + MDX via `@astrojs/mdx`
- **Hosting:** [Contentstack Launch](https://www.contentstack.com/products/launch)

## Project Structure

```
src/
├── components/
│   ├── ApiTester.tsx       # React island — live API caller
│   ├── BlogCard.astro      # Blog post card with View Transitions
│   ├── Counter.tsx         # React island — interactive counter
│   └── FeatureCard.astro   # Feature showcase card
├── content/
│   ├── config.ts           # Zod collection schemas
│   └── blog/               # Markdown + MDX posts
├── layouts/
│   ├── Layout.astro        # Base layout with nav + ViewTransitions
│   └── BlogLayout.astro    # Blog post layout
├── middleware/
│   └── index.ts            # Request logging, locals injection, auth check
├── pages/
│   ├── api/                # API routes (SSR)
│   │   ├── echo.ts         # Echo GET + POST
│   │   ├── hello.ts        # Hello endpoint
│   │   └── time.ts         # Server time endpoint
│   ├── blog/               # Blog (SSG)
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── ssr/                # SSR demos
│   │   ├── index.astro     # SSR page with request data
│   │   └── user/[id].astro # Dynamic SSR route
│   ├── about.astro         # SSG
│   ├── api-demo.astro      # SSR + React island
│   ├── features.astro      # SSG
│   ├── index.astro         # SSG home
│   ├── islands.astro       # SSG + React islands
│   └── middleware-demo.astro # SSR
└── styles/
    └── global.css
```

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Produces:
- `dist/client/` — static assets and prerendered HTML pages
- `dist/server/entry.mjs` — Node.js server for SSR routes

## Deploy to Contentstack Launch

### Option 1: Git Integration (recommended)

1. Push this repo to GitHub / GitLab
2. In the [Launch dashboard](https://app.contentstack.com), create a new application
3. Connect your repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/client`
   - **Start command:** `node dist/server/entry.mjs`
5. Set environment variables (if any) in the Launch dashboard
6. Deploy 🚀

### Option 2: Manual Upload

```bash
npm run build
# Upload the dist/ folder to your Launch environment
```

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port for the Node.js server (default: 4321) | No |
| `HOST` | Host to bind (default: 0.0.0.0) | No |

> Update `site` in `astro.config.mjs` to your Launch app URL before deploying for correct canonical URLs and sitemap.

## Rendering Architecture

This project uses `output: "static"` (Astro v5 default) with the `@astrojs/node` adapter:

- **SSG pages** are pre-rendered to HTML at build time and served as static files
- **SSR pages** use `export const prerender = false` and are rendered on every request by the Node.js server
- **API routes** are always SSR
- **Middleware** runs on every request (SSR only; skipped for static files)

## Key Astro v5 Notes

- `output: "hybrid"` was removed in v5 — use `output: "static"` instead
- SSR opt-in is now: `export const prerender = false` on any page/route
- Content Collections now use `src/content/config.ts` for schema definitions
- View Transitions use `import { ViewTransitions } from "astro:transitions"`

---

Built with ❤️ to test every Astro feature on Contentstack Launch.
