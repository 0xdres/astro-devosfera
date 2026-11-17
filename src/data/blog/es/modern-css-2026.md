---
title: "CSS moderno en 2026: container queries, :has() y anchor positioning"
description: El CSS de hoy no tiene nada que envidiar a JavaScript para maquetaciones complejas. Guía práctica de las tres características que más cambiaron el desarrollo de interfaces.
pubDatetime: 2026-02-03T10:00:00Z
tags:
  - css
  - frontend
  - diseño
  - web
draft: false
---

Durante años, la respuesta a "¿cómo hago X en CSS?" era "usa JavaScript". En 2026 esa respuesta ya no se aplica en la mayoría de los casos. Tres características en particular redibujaron el mapa del diseño en el navegador.

## Container Queries: responder al contenedor, no a la pantalla

Las media queries responden al ancho del _viewport_ (la pantalla). El problema: un componente puede vivir en una columna estrecha o en una ancha según el diseño del padre. Las **container queries** resuelven esto.

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

### Unidades de container queries

Las consultas también exponen unidades relativas al contenedor:

```css file=typography.css
.card__title {
  font-size: clamp(1rem, 4cqi, 2rem); /* cqi = container query inline size */
}
```

## La pseudoclase `:has()` — el selector de padre que siempre quisimos

`:has()` selecciona un elemento en función de sus **descendientes**. Es el "selector de padre" que CSS negó durante décadas.

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

> `:has()` tiene soporte en todos los navegadores modernos desde 2023. Puedes usarlo en producción hoy mismo sin polyfills.

## Anchor Positioning: tooltips y popovers sin JavaScript

Antes de Anchor Positioning, colocar un tooltip de forma relativa a su disparador requería calcular posiciones con JavaScript. Ya no:

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

### `position-try-fallbacks`: lógica de colisiones declarativa

```css file=tooltip.css
.tooltip {
  position-try-fallbacks:
    flip-block,
    /* try top if it doesn't fit below */ flip-inline,
    /* try left if it doesn't fit right */ flip-start; /* combine both */
}
```

## ¿Qué pasa con el soporte?

| Característica     | Chrome | Firefox | Safari  |
| ------------------ | ------ | ------- | ------- |
| Container Queries  | 105+ ✓ | 110+ ✓  | 16+ ✓   |
| `:has()`           | 105+ ✓ | 121+ ✓  | 15.4+ ✓ |
| Anchor Positioning | 125+ ✓ | 131+ ✓  | 18+ ✓   |

En 2026, con la distribución actual de navegadores, puedes usar las tres en producción para la mayoría de los proyectos. Considera polyfills solo si tu audiencia incluye navegadores muy antiguos.

## El CSS actual es declarativo y expresivo

La revolución silenciosa de CSS no fue Grid ni Flexbox. Fue el cambio de mentalidad: **el navegador razona sobre las restricciones, tú declaras el resultado deseado**. Las container queries, `:has()` y el posicionamiento de anclajes (anchor positioning) son la culminación de ese paradigma.
