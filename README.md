# Devosfera Blog

Heavily customized version of the [AstroPaper](https://github.com/satnaing/astro-paper) theme with a new aesthetic, image galleries, global search modal, and dozens of visual and interactive improvements.

**🌐 Clean template live demo:** [devosfera-blog.vercel.app](https://devosfera-blog.vercel.app)

![Devosfera OG](public/devosfera-og.webp)

> [!TIP]
> **🌟 Real-World Showcase:**  
> Visit **[devosfera.vercel.app](https://devosfera.vercel.app)** to see this template running in production on the creator's personal blog with custom advanced interactive extensions (interactive terminal, daily physics widgets, web audio synthesizers, and quizzes).
>
> 📖 To explore the complete architecture and design decisions behind this base template, read the deep-dive article:  
> **[Introducing Astro Devosfera: Re-engineering the Developer Blog Experience](https://devosfera.vercel.app/posts/introducing-astro-devosfera)** _(also available in [Spanish](https://devosfera.vercel.app/es/posts/introducing-astro-devosfera))_.

> [!IMPORTANT]
> **Social links and personal URLs are no longer hardcoded.**
> They are loaded from environment variables so that forks of this repo do not expose the original author's personal data.
> Copy `.env.example` → `.env` and fill in your own values before running the project. See the [Configuration](#%EF%B8%8F-configuration) section for details.

---

## Table of contents

1. [Features](#-features)
2. [Project structure](#-project-structure)
3. [Installation and local development](#-installation-and-local-development)
4. [Commands](#-commands)
5. [Creating content](#-creating-content)
   - [Posts](#posts-srcdatablogenes)
   - [Image galleries](#galleries-srcdatagalleriesenes)
6. [GalleryEmbed component](#%EF%B8%8F-galleryembed-component)
7. [Configuration](#%EF%B8%8F-configuration)
8. [Upstream issues resolved](#-upstream-issues-resolved)
9. [License](#-license)

---

## ✨ Features

### Core (inherited from AstroPaper)

- Type-safe Markdown, good performance, accessible and responsive
- Full SEO (meta tags, Open Graph, sitemap, RSS), light/dark mode
- Dynamically generated OG images with Satori

### Modern design

- Hero with animated prompt configurable from `heroTerminalPrompt` in `src/config.ts` (default: `~/ready-to-go $`)
- Reusable `<AuroraHero>` section headers with interactive mouse-tracking aurora orbs
- Global backdrop: grid + cursor glow + noise texture (all pages) optional and configurable from `src/config.ts`
- Glassmorphism on navbar, cards and modals

### Custom typography

| Role         | Font                |
| :----------- | :------------------ |
| Body         | `Wotfard` (local)   |
| Code / Mono  | `Fira Code` (local) |
| Italics / H3 | `Sriracha` (Local)  |

### Global search (⌘K)

- Modal via `⌘K` / `Ctrl+K` powered by **Pagefind** (static index) and full keyboard navigation (if you want to test it locally, run `pnpm run build` first and after that `pnpm run dev` or `pnpm run preview` since the index is only generated in production)

### Image galleries (`/galleries`)

- Albums in `src/data/galleries/{en,es}/<slug>/`; images optimized at build-time (srcset, WebP, lazy)
- Native lightbox with `<dialog>`, redesigned fullscreen layout, keyboard navigation and edge-aware prev/next controls
- `<GalleryEmbed>` to embed galleries inside MDX posts without importing
- Controlled by `showGalleries` in `src/config.ts` (also gates gallery inclusion in mixed feeds) — see [GALLERIES.md](GALLERIES.md)

### Unified mixed feed (posts + galleries)

- Optional mixed feed controlled by `showGalleriesInIndex` in `src/config.ts` (effective only if `showGalleries` is `true`)
- When both flags are enabled, gallery entries are included in `/`, `/posts`, `/archives`, `/tags`, and `/rss.xml`
- Shared URL/date helpers keep routing and publish-date sorting consistent across all listing pages
- Gallery entries include a visual badge in cards and archive timeline items

### Performance and maintainability improvements

- Parallel collection loading in key routes using `Promise.all`
- Optimized sorting and tag extraction logic for larger content sets
- Stronger shared typing across blog/gallery entries (removed weak `any` usage)
- Reduced duplicated route/slug logic by centralizing entry helpers

### Branded audio player

- Intro audio player in the hero with terminal aesthetic (wave bars, progress bar)
- Fully togglable and configurable from `src/config.ts`

### Reading experience

- Distraction-free **Reading Mode** (`R` shortcut, Sans/Serif typography toggle, 80%–150% font scaling)
- Sticky desktop **Table of Contents** sidebar with scrollspy active-section highlighting
- Scroll-driven **Reading Progress Bar** and automatic **"Resume reading where you left off"** bookmark toast
- Hybrid post navigation (chronological previous post + tag-scored **Recommended Read**)

### Bilingual architecture (`en` / `es`)

- Complete English (`/`) and Spanish (`/es/*`) route tree with header and mobile language switcher (`EN` / `ES`)
- Locale-organized content in `src/data/blog/{en,es}/` and `src/data/galleries/{en,es}/`
- `hreflang` alternate links, localized Open Graph metadata, and dedicated RSS feeds (`/rss.xml` and `/es/rss.xml`)

### Redesigned pages

| Page         | Highlights                                                          |
| :----------- | :------------------------------------------------------------------ |
| `/` Home     | Terminal hero, featured grid, section counters, optional mixed feed |
| `/posts`     | Unified 3-column grid (posts + galleries) with inline Pagefind      |
| `/archives`  | Vertical timeline with glow, includes gallery entries               |
| `/tags`      | Grid with proportional progress bar                                 |
| `/galleries` | Album grid and fullscreen native `<dialog>` lightbox viewer         |

---

## 🚀 Project structure

```
/
├── public/
│   ├── audio/             # Audio files (intro, etc.)
│   └── pagefind/          # Search index (generated at build)
├── src/
│   ├── assets/            # Local fonts, SVG icons and logo
│   ├── components/        # Reusable Astro components
│   ├── data/
│   │   ├── blog/          # Posts .md / .mdx by locale (en/, es/)
│   │   └── galleries/     # Galleries by locale (en/<slug>/, es/<slug>/)
│   ├── i18n/              # UI translation dictionaries and locale helpers
│   ├── layouts/           # Root layout, PostDetails, AboutLayout
│   ├── pages/             # Astro routes (/ and /es/*)
│   ├── scripts/           # Modular client-side TypeScript modules
│   ├── styles/            # global.css, header.css, post-details.css, typography.css
│   └── utils/             # Filters, static paths, OG with Satori, Shiki transformers
├── tests/                 # Unit test suite (Node.js native test runner)
└── astro.config.ts
```

---

## 👨🏻‍💻 Installation and local development

**Requirements:** Node.js 22.12+ (Node.js 24+ for unit tests) and pnpm.

```bash
# 1. Install dependencies
pnpm install

# 2. Development server
pnpm run dev
# → http://localhost:4321
```

The Pagefind search index is **only available in the production build**. To test it locally:

```bash
pnpm run build && pnpm run preview/dev
```

### Docker

```bash
docker build -t devosfera-blog .
docker run -p 4321:80 devosfera-blog
```

---

## 🧞 Commands

| Command            | Action                                              |
| :----------------- | :-------------------------------------------------- |
| `pnpm install`     | Install dependencies                                |
| `pnpm run dev`     | Local dev server at `localhost:4321`                |
| `pnpm run build`   | Production build (`astro check` + build + Pagefind) |
| `pnpm run preview` | Preview the production build                        |
| `pnpm test`        | Run unit tests (Node.js native test runner)         |
| `pnpm run format`  | Format with Prettier                                |
| `pnpm run lint`    | Lint with ESLint                                    |

> `pnpm run build` internally runs `pagefind --site dist && cp -r dist/pagefind public/`. The search index ends up in `public/pagefind/` ready for preview.

---

## 📝 Creating content

### Posts (`src/data/blog/{en,es}/`)

Create a `.md` or `.mdx` file with the following frontmatter:

```yaml
---
title: "Post title"
pubDatetime: 2026-01-15T10:00:00Z # required — ISO 8601 with timezone
description: "Short description for SEO and cards"
tags: ["astro", "dev"]
featured: false # highlight on the home page
draft: false # hidden in production
---
```

**MDX**: JSX components can be used directly. `<GalleryEmbed>` is available without importing it (see next section).

**Table of Contents**: Automatically rendered in the desktop sidebar with dynamic scrollspy highlighting for `h2` and `h3` headings.

**Annotated code blocks** (via Shiki transformers):

```
// [!code highlight]      → highlight the line
// [!code ++]             → added line (diff)
// [!code --]             → removed line (diff)
// fileName: file.ts      → display the filename above the block
```

---

### Galleries (`src/data/galleries/{en,es}/`)

Quick setup:

1. Create a folder in `src/data/galleries/en/<slug>/` (and `src/data/galleries/es/<slug>/` for Spanish).
2. Add `index.md` (gallery metadata) and image files.
3. Use numeric prefixes (`01-`, `02-`, …) if you want to control image order.
4. The folder slug becomes the route: `/galleries/<slug>` (and `/es/galleries/<slug>`).

For full details (frontmatter fields, cover behavior, alt generation, and image optimization), see [GALLERIES.md](GALLERIES.md).

---

## 🖼️ GalleryEmbed component

Embed a gallery inside any `.mdx` post — **no import needed**:

```mdx
<GalleryEmbed slug="my-trip-to-tokyo" />
```

Optional props: `limit` (`0` = all), `cols` (`2 | 3 | 4`), `showLink` (`true/false`).

For advanced usage, full props reference, lightbox behavior, and invalid slug fallback, see [GALLERIES.md](GALLERIES.md#galleryembed--gallery-inside-mdx-posts).

---

## ⚙️ Configuration

All site configuration lives in `src/config.ts` (the `SITE` constant). It includes general settings (title, description, timezone), feature toggles (galleries, audio player, mixed feed), and content limits (posts per page, gallery embed limit).

Social links and "Share" links are defined in `src/constants.ts`.

> [!WARNING]
> **Breaking change — social links moved to environment variables.**
>
> Previously, social URLs (GitHub, X, LinkedIn, email) and the "Edit this post" URL were hardcoded in `src/constants.ts` and `src/config.ts`. This caused every fork of the repo to expose the original author's personal data publicly, leading to unwanted spam.
>
> **What changed:**
>
> | Variable                 | What it controls                         |
> | :----------------------- | :--------------------------------------- |
> | `PUBLIC_SOCIAL_GITHUB`   | GitHub profile link & JSON-LD author URL |
> | `PUBLIC_SOCIAL_X`        | X / Twitter profile link                 |
> | `PUBLIC_SOCIAL_LINKEDIN` | LinkedIn profile link                    |
> | `PUBLIC_SOCIAL_EMAIL`    | Contact email (shown as `mailto:` link)  |
> | `PUBLIC_EDIT_POST_URL`   | "Edit this post" button base URL         |
>
> **To restore your socials after forking or updating:**
>
> ```bash
> cp .env.example .env
> # fill in your own values in .env
> ```
>
> For production deployments (Vercel, Netlify, etc.), add these variables in your platform's environment settings.
> Any variable left **unset** simply hides that social link — no errors, no broken UI.

---

## 🐛 Upstream issues resolved

Bugs and feature requests from the official [AstroPaper](https://github.com/satnaing/astro-paper) repository implemented in this version:

| Issue                                                      | Description                                                                                                                                                                                                      | Files                                        | Credits                                                                                                                                          |
| :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| [#614](https://github.com/satnaing/astro-paper/issues/614) | **Back to Top shifts the pagination button** when `ShareLinks` is empty                                                                                                                                          | `BackToTopButton.astro`                      | —                                                                                                                                                |
| [#574](https://github.com/satnaing/astro-paper/issues/574) | **Markdown tables overflow the layout on mobile** — fixed with `w-full table-auto` and `word-wrap` on cells                                                                                                      | `typography.css`                             | [@GladerJ](https://github.com/GladerJ) — [solution](https://github.com/satnaing/astro-paper/issues/574#issuecomment-3427381261)                  |
| [#569](https://github.com/satnaing/astro-paper/issues/569) | **Back to Top inconsistent on desktop** — unified circular design with progress ring and `fixed` positioning                                                                                                     | `BackToTopButton.astro`, `PostDetails.astro` | —                                                                                                                                                |
| [#566](https://github.com/satnaing/astro-paper/issues/566) | **Share links don't open in a new tab** — added `target="_blank"` and `rel="noopener noreferrer"`                                                                                                                | `ShareLinks.astro`                           | [PR #611](https://github.com/satnaing/astro-paper/pull/611) by [@zerone0x](https://github.com/zerone0x)                                          |
| [#131](https://github.com/satnaing/astro-paper/issues/131) | **No MDX support** — added `@astrojs/mdx` integration with `extendMarkdownConfig: true`                                                                                                                          | `astro.config.ts`, `content.config.ts`       | —                                                                                                                                                |
| [#495](https://github.com/satnaing/astro-paper/issues/495) | **Inconsistent post filtering by timezone** — resolved using native UTC timestamp comparison (`Date.now() > pubTime - margin`) in `postFilter.ts`, eliminating external date libraries and timezone offset drift | `postFilter.ts`                              | [@kj-9](https://github.com/kj-9) — [reference fix](https://github.com/satnaing/astro-paper/compare/main...kj-9:astro-paper:fix-post-filter-date) |
| [#553](https://github.com/satnaing/astro-paper/issues/553) | **No galleries section** — implemented full `/galleries` section with lightbox, `GalleryEmbed`, image optimization and `showGalleries` flag. See [GALLERIES.md](GALLERIES.md)                                    | multiple — see GALLERIES.md                  | —                                                                                                                                                |

---

## 📜 License

Based on [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev), licensed under MIT.
Customizations © [0xdres](https://github.com/0xdres).
