---
title: "Modern CSS in 2026: container queries, :has() and anchor positioning"
description: Today's CSS has nothing to envy JavaScript for complex layouts. Practical guide to the three features that changed interface development the most.
pubDatetime: 2026-02-03T10:00:00Z
tags:
  - css
  - frontend
  - design
  - web
draft: false
---

For years, the answer to "how do I do X in CSS?" was "use JavaScript". In 2026 that answer no longer applies in most cases. Three features in particular redrew the design map in the browser.

## Table of contents

## Container Queries: respond to the container, not the screen

Media queries respond to the _viewport_ width. The problem: a component can live in a narrow column or a wide one depending on the parent layout. **Container queries** solve this.

```css file=card.css
/* Declare the container */
.card-wrapper {
  container-type: inline-size; /* [!code highlight] */
  container-name: card;
}

/* The component responds to its container */
@container card (min-width: 400px) {
  /* [!code highlight] */
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }

  .card__image {
    grid-row: 1 / 3;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

```html file=card.html
<!-- The same component works in any context -->
<aside class="card-wrapper" style="width: 300px">
  <article class="card">...</article>
  <!-- vertical layout -->
</aside>

<main class="card-wrapper" style="width: 700px">
  <article class="card">...</article>
  <!-- horizontal layout -->
</main>
```

### Container query units

Queries also expose container-relative units:

```css file=typography.css
.card__title {
  font-size: clamp(1rem, 4cqi, 2rem); /* cqi = container query inline size */
}
```

## The `:has()` pseudoclass — the parent selector we always wanted

`:has()` selects an element based on its **descendants**. It's the "parent selector" that CSS denied for decades.

```css file=styles.css
/* Form with empty required field */
form:has(input:required:invalid) .submit-btn {
  opacity: 0.5;
  pointer-events: none;
}

/* Card containing an image: different layout */
.card:has(img) {
  /* [!code highlight] */
  display: grid;
  grid-template-columns: 150px 1fr;
}

.card:not(:has(img)) {
  padding: 1.5rem;
}

/* Navbar with open menu: disable scroll on body */
body:has(.nav-menu[aria-expanded="true"]) {
  /* [!code highlight] */
  overflow: hidden;
}
```

> `:has()` has support in all modern browsers since 2023. You can use it in production today without polyfills.

## Anchor Positioning: tooltips and popovers without JavaScript

Before Anchor Positioning, placing a tooltip relative to its trigger required calculating positions with JavaScript. Not anymore:

```css file=tooltip.css
/* Declare the anchor */
.btn-trigger {
  anchor-name: --my-button; /* [!code highlight] */
}

/* Position the tooltip relative to the anchor */
.tooltip {
  position: absolute;
  position-anchor: --my-button; /* [!code highlight] */
  bottom: calc(anchor(top) + 8px); /* [!code highlight] */
  left: anchor(center); /* [!code highlight] */
  transform: translateX(-50%);

  /* Flip automatically if it doesn't fit */
  position-try-fallbacks: flip-block; /* [!code ++] */
}
```

```html file=tooltip.html
<button class="btn-trigger" popovertarget="tip">Hover me</button>
<div id="tip" class="tooltip" popover>
  This tooltip positions itself, without JS.
</div>
```

### `position-try-fallbacks`: declarative collision logic

```css file=tooltip.css
.tooltip {
  position-try-fallbacks:
    flip-block,
    /* try top if it doesn't fit below */ flip-inline,
    /* try left if it doesn't fit right */ flip-start; /* combine both */
}
```

## What about support?

| Feature            | Chrome | Firefox | Safari  |
| ------------------ | ------ | ------- | ------- |
| Container Queries  | 105+ ✓ | 110+ ✓  | 16+ ✓   |
| `:has()`           | 105+ ✓ | 121+ ✓  | 15.4+ ✓ |
| Anchor Positioning | 125+ ✓ | 131+ ✓  | 18+ ✓   |

In 2026, with the current browser distribution, you can use all three in production for most projects. Consider polyfills only if your audience includes very old browsers.

## Today's CSS is declarative and expressive

The silent revolution of CSS was not Grid or Flexbox. It was the mindset change: **the browser reasons about constraints, you declare the desired result**. Container queries, `:has()` and anchor positioning are the culmination of that paradigm.
