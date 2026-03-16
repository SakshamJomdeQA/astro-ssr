---
title: "Understanding Static Site Generation in Astro"
description: "Explore how Astro's SSG produces blazing-fast, zero-JS pages by default, perfect for content-heavy sites and optimal Core Web Vitals."
pubDate: 2024-01-15
author: "Astro Team"
tags: ["astro", "ssg", "performance", "tutorial"]
image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop"
featured: true
---

## What is Static Site Generation?

Static Site Generation (SSG) is Astro's **default rendering mode**. At build time, Astro renders every page to plain HTML, CSS, and the minimum necessary JavaScript. The result is a folder of static files you can serve from any CDN or file host.

> **Key insight:** With SSG, every visitor gets the same pre-built HTML — no server processing at request time. This means sub-50ms Time to First Byte (TTFB) served from the edge.

## How Astro Implements SSG

Astro's build pipeline:

1. Discovers all `.astro`, `.md`, and `.mdx` files in `src/pages/`
2. Evaluates the frontmatter and component scripts at **build time**
3. Renders them to static HTML
4. Optionally hydrates interactive "islands" on the client

```astro
---
// This code runs ONLY at build time
const posts = await Astro.glob('../content/**/*.md');
const sorted = posts.sort((a, b) => 
  new Date(b.frontmatter.pubDate) - new Date(a.frontmatter.pubDate)
);
---

<ul>
  {sorted.map(post => (
    <li><a href={post.url}>{post.frontmatter.title}</a></li>
  ))}
</ul>
```

## Dynamic Routes with SSG

Even "dynamic" routes like `/blog/[slug]` can be statically generated using `getStaticPaths()`:

```astro
---
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
const { post } = Astro.props;
---
```

Astro calls `getStaticPaths()` once at build time and generates one HTML file per returned path.

## When to Use SSG

| Use Case | SSG? |
|---|---|
| Blog / documentation | ✅ Perfect |
| Marketing pages | ✅ Perfect |
| Portfolio | ✅ Perfect |
| Real-time dashboard | ❌ Use SSR |
| User-specific content | ❌ Use SSR |

## Performance Benefits

- **No runtime server** — serve from a CDN
- **Instant cache hits** — every page is a static asset
- **Excellent SEO** — crawlers see full HTML immediately
- **Minimal JavaScript** — Astro ships 0 JS by default

## Content Collections

Astro's **Content Collections** are the recommended way to manage local content. They provide:

- TypeScript schema validation via Zod
- Type-safe frontmatter access
- Automatic slug generation
- MDX support

This very blog post is part of the `blog` content collection!
