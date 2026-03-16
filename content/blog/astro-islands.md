---
title: "Astro Islands Architecture"
description: "Understand how Astro Islands let you sprinkle interactivity into otherwise static pages — using React, Vue, Svelte, or any other framework."
pubDate: 2024-03-05
author: "Astro Team"
tags: ["astro", "islands", "react", "architecture"]
image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop"
featured: false
---

## The Problem Islands Solve

Traditional SPAs (Single Page Applications) ship an entire JavaScript bundle to the browser, even for pages that are mostly static text. This bloats bundle sizes and hurts performance.

Astro's **Islands Architecture** solves this by treating interactive components as **isolated islands** in a sea of static HTML. Each island is independently hydrated, only when needed.

## How Islands Work

An "island" is any Astro component that uses a **client directive**:

| Directive | When it Hydrates |
|---|---|
| `client:load` | Immediately on page load |
| `client:idle` | When the browser is idle |
| `client:visible` | When the component enters the viewport |
| `client:media="(max-width: 640px)"` | When a media query matches |
| `client:only="react"` | Only on the client, never SSR |

## Example: A React Island

```astro
---
// This file is a .astro page
import Counter from '../components/Counter.tsx';
---

<!-- Static HTML — zero JS -->
<h1>My Static Page</h1>
<p>This is rendered at build time.</p>

<!-- Interactive island — React ships ONLY for this component -->
<Counter client:visible initialCount={0} />
```

The React `Counter` component:

```tsx
import { useState } from 'react';

export default function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

## Partial Hydration Benefits

- Pages ship **minimal JS** — only island code is sent
- Islands load **in parallel**, not sequentially like a full SPA
- **Framework-agnostic** — mix React, Vue, and Svelte on the same page
- Static content is **instantly visible** before any JS runs

## Multiple Frameworks

```astro
---
import ReactIsland from './ReactIsland.tsx';
import VueIsland from './VueIsland.vue';
import SvelteIsland from './SvelteIsland.svelte';
---

<ReactIsland client:load />
<VueIsland client:idle />
<SvelteIsland client:visible />
```

## Passing State Between Islands

Islands are isolated by design, but you can share state using:

1. **Nano Stores** (`nanostores`) — tiny framework-agnostic state
2. **Custom Events** — `window.dispatchEvent(new CustomEvent(...))`
3. **URL / localStorage** — for persistence across navigations

## When NOT to Use Islands

If an entire page needs to be interactive (e.g. a rich app dashboard), use a full React/Vue SPA instead of Astro. Islands shine for **content-first** pages with **pockets of interactivity**.
