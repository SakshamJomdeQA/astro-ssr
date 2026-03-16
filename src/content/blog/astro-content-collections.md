---
title: "Content Collections & MDX in Astro"
description: "Master Astro's Content Collections API for type-safe, schema-validated local content — with Zod schemas, MDX components, and more."
pubDate: 2024-03-20
author: "Astro Team"
tags: ["astro", "content-collections", "mdx", "zod"]
image: "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&auto=format&fit=crop"
draft: false
---

## What Are Content Collections?

Content Collections are Astro's **type-safe system for managing local content**. Instead of scattering Markdown files and hoping the frontmatter is correct, Collections give you:

- **Zod schema validation** — catch typos and missing fields at build time
- **TypeScript types** — full IntelliSense in your editor
- **Automatic slug generation** — based on file name
- **MDX support** — embed interactive components in Markdown

## Defining a Collection

Create `src/content/config.ts`:

```ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

Now every file in `src/content/blog/` must satisfy this schema — or the build fails with a clear error message.

## Querying Collections

```astro
---
import { getCollection, getEntry } from "astro:content";

// Get all non-draft posts
const posts = await getCollection("blog", ({ data }) => !data.draft);

// Sort by date
const sorted = posts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);

// Get a single entry by slug
const featured = await getEntry("blog", "astro-ssg-guide");
---
```

## Rendering Collection Entries

```astro
---
const { post } = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

`post.render()` returns the compiled `Content` component, which you can render anywhere in your template.

## MDX: Markdown + JSX

MDX files (`.mdx`) let you use **JSX components inside Markdown**:

```mdx
---
title: "My MDX Post"
---

import MyChart from '../../components/MyChart.tsx';

# Hello MDX!

Here's an interactive chart embedded in Markdown:

<MyChart client:visible data={[1, 2, 3]} />

Regular **Markdown** still works fine.
```

## Data Collections

Besides content (Markdown/MDX), you can also define **data collections** for JSON/YAML:

```ts
const authors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url(),
  }),
});
```

Then query with `getEntry("authors", "jane-doe")`.

## Type Safety in Practice

```ts
import type { CollectionEntry } from "astro:content";

interface Props {
  post: CollectionEntry<"blog">; // Fully typed!
}

const { post } = Astro.props;
post.data.title;    // string ✅
post.data.pubDate;  // Date ✅
post.data.tags;     // string[] ✅
```

Content Collections are one of Astro's most powerful features — they bring the DX of a full CMS to plain Markdown files.
