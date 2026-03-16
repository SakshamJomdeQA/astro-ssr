---
title: "View Transitions & Routing in Astro"
description: "Add smooth, SPA-like page transitions to your Astro site using the built-in View Transitions API — no client-side router needed."
pubDate: 2024-04-01
author: "Astro Team"
tags: ["astro", "view-transitions", "animations", "routing"]
image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop"
draft: false
---

## View Transitions

Astro's View Transitions API lets you create **smooth, animated page navigations** without shipping a client-side router or SPA framework. It uses the browser's native [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) with a fallback for unsupported browsers.

## Enabling View Transitions

Add the `<ViewTransitions />` component to your layout's `<head>`:

```astro
---
import { ViewTransitions } from "astro:transitions";
---

<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

That's it — every `<a>` link on your site now performs a smooth animated transition instead of a full page reload.

## Named Transitions

Control *which* elements animate and *how* using `transition:name`:

```astro
<!-- List page -->
<img src={post.image} transition:name={`post-image-${post.slug}`} />
<h2 transition:name={`post-title-${post.slug}`}>{post.title}</h2>

<!-- Detail page -->
<img src={post.image} transition:name={`post-image-${post.slug}`} />
<h1 transition:name={`post-title-${post.slug}`}>{post.title}</h1>
```

Elements with the same `transition:name` on both pages animate as a **shared element transition** — the image or heading smoothly morphs from its list position to its detail position.

## Built-in Animations

Astro ships several built-in transition animations:

```astro
---
import { fade, slide, morph } from "astro:transitions";
---

<div transition:animate={fade({ duration: "0.3s" })}>
  Fades in/out
</div>

<div transition:animate={slide({ duration: "0.4s" })}>
  Slides in from the right
</div>
```

You can also write custom CSS animations using the `transition:animate` prop.

## Lifecycle Events

Hook into the navigation lifecycle:

```js
document.addEventListener("astro:before-preparation", () => {
  // About to fetch the next page
});

document.addEventListener("astro:after-preparation", () => {
  // Next page fetched, transition starting
});

document.addEventListener("astro:after-swap", () => {
  // DOM swapped, reinitialise any JS that doesn't persist
});
```

## Persisting Elements Across Pages

Some elements (like a media player) should **not** be re-mounted between navigations:

```astro
<audio transition:persist src="/podcast.mp3" controls />
```

The `transition:persist` directive keeps the element alive across page navigations, so your podcast keeps playing even as the user browses.

## Browser Support

The native View Transitions API requires Chrome 111+ / Edge 111+. Astro automatically falls back to an **instant swap** (no animation) on unsupported browsers, so your site works everywhere.

## Performance Impact

View Transitions are implemented as CSS animations — they run on the **compositor thread** and don't block the main thread. Navigation feels instant even on slower connections because Astro prefetches the next page HTML in the background.
