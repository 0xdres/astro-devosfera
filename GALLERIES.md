# Feature: Image Galleries

> Technical documentation for the **Galleries** feature.  
> Reference: [astro-paper issue #553](https://github.com/satnaing/astro-paper/issues/553)

---

## Table of contents

1. [Overview](#overview)
2. [Files involved](#files-involved)
3. [How to create a gallery](#how-to-create-a-gallery)
4. [Frontmatter: available fields](#frontmatter-available-fields)
5. [How images are processed](#how-images-are-processed)
6. [Automatic alt text](#automatic-alt-text)
7. [Cover image (coverImage)](#cover-image-coverimage)
8. [Enable / disable and visibility flags](#enable--disable-and-visibility-flags)
9. [Mixed feed integration (posts + galleries)](#mixed-feed-integration-posts--galleries)
10. [GalleryEmbed — gallery inside MDX posts](#galleryembed--gallery-inside-mdx-posts)
11. [Architecture and data flow](#architecture-and-data-flow)
12. [Lightbox](#lightbox)
13. [Styles and responsive](#styles-and-responsive)
14. [Known limitations](#known-limitations)
15. [Future extensions](#future-extensions)

---

## Overview

The Galleries feature allows publishing bilingual image collections accessible at `/galleries` (English) and `/es/galleries` (Spanish). Each gallery is a **folder** inside `src/data/galleries/{en,es}/<slug>/` containing:

- An `index.md` (or `index.mdx`) file with the gallery metadata.
- The image files directly in that folder.

Images are processed by the **Astro Assets** pipeline (`astro:assets`) at build time, generating optimized responsive versions with `srcset`, lazy loading, and modern `AVIF` output.

In addition to `/galleries` and `/es/galleries`, gallery entries can participate in the global mixed feed (`posts + galleries`) used by `/`, `/posts`, `/archives`, `/tags`, `/rss.xml`, and their `/es/*` counterparts.

---

## Files involved

| File | Role |
| --- | --- |
| `src/config.ts` | `showGalleries` + `showGalleriesInIndex` flags |
| `src/content.config.ts` | `galleries` collection definition with Zod schema |
| `src/components/AuroraHero.astro` | Reusable section hero banner on gallery index pages |
| `src/components/GalleryCard.astro` | Card used in the gallery listing grid |
| `src/components/GalleryEmbed.astro` | Component to embed galleries inside MDX posts |
| `src/components/GalleryLightbox.astro` | Shared native `<dialog>` lightbox component with View Transitions cleanup |
| `src/components/Card.astro` | Shared card for blog/gallery mixed feeds (adds gallery badge) |
| `src/components/Header.astro` / `MobileMenu.astro` | Conditional nav links for `/galleries` and `/es/galleries` |
| `src/assets/icons/IconGallery.svg` | Gallery icon used in header/cards/archive timeline |
| `src/pages/galleries/index.astro` | English gallery listing `/galleries` |
| `src/pages/galleries/[gallery].astro` | English gallery detail `/galleries/<slug>` |
| `src/pages/es/galleries/index.astro` | Spanish gallery listing `/es/galleries` |
| `src/pages/es/galleries/[gallery].astro` | Spanish gallery detail `/es/galleries/<slug>` |
| `src/pages/index.astro` | Optional mixed feed on homepage (and `/es`) |
| `src/pages/posts/index.astro` | Unified mixed post listing with inline Pagefind & tag filters |
| `src/pages/archives/index.astro` | Optional mixed archive timeline |
| `src/pages/tags/index.astro` & `src/pages/tags/[tag]/[...page].astro` | Optional mixed tag index & detail pagination |
| `src/pages/rss.xml.ts` & `src/pages/es/rss.xml.ts` | Optional localized mixed RSS feeds |
| `src/layouts/PostDetails.astro` | Registers `GalleryEmbed` as a global MDX component |
| `src/utils/gallery.ts` | Centralized `allGalleryImages` glob, `getGalleryImages`, `getFirstGalleryImage`, and `filenameToAlt` |
| `src/utils/staticPaths.ts` | Shared `buildGalleryStaticPaths(locale)` helper |
| `src/utils/contentEntry.ts` | Shared typing, `getGallerySlug`, and URL helpers for blog/gallery entries |
| `src/utils/getSortedPosts.ts` | Shared date sorting for mixed entries |
| `src/utils/getUniqueTags.ts` | Shared tag extraction for mixed entries |
| `src/utils/getPostsByTag.ts` | Shared tag filtering for mixed entries |
| `src/utils/getPostsByGroupCondition.ts` | Shared archive grouping helper for mixed entries |
| `src/data/galleries/{en,es}/` | Root directories for localized gallery content |

---

## How to create a gallery

### Folder structure

```
src/data/galleries/
├── en/
│   └── gallery-name/
│       ├── index.md          ← required metadata (English)
│       ├── 01-first.jpg
│       ├── 02-second.jpg
│       └── 03-third.png
└── es/
    └── gallery-name/
        ├── index.md          ← required metadata (Spanish)
        ├── 01-first.jpg
        ├── 02-second.jpg
        └── 03-third.png
```

### Naming rules

- The **folder** name after the locale directory becomes the URL slug: `gallery-name` → `/galleries/gallery-name` (and `/es/galleries/gallery-name`).
- `getGallerySlug(id)` in `src/utils/contentEntry.ts` strips the leading `en/` or `es/` locale prefix and trailing `/index` segment.
- The metadata file must be named **exactly** `index.md` or `index.mdx`.
- Images are displayed **sorted alphabetically** by filename. Using a numeric prefix (`01-`, `02-`, …) is the recommended way to control the order.

---

## Frontmatter: available fields

```yaml
---
title: My Trip to Japan              # required — visible gallery name
description: Travel photos...        # required — shown in the card and <meta description>
pubDatetime: 2026-01-20T00:00:00Z    # required — publication date (ISO 8601)
draft: false                         # optional — if true, not published (default: false)
coverImage: ./01-tokyo.jpg           # optional — explicit cover image (see coverImage section)
tags:                                # optional — array of tags (no #)
  - japan
  - travel
---
```

> **Note:** unlike blog posts, galleries **have no document body**. All visual content comes from the images in the folder. Scheduled future dates and `draft: true` entries are filtered out across listing routes via `postFilter`.

---

## How images are processed

`allGalleryImages` in `src/utils/gallery.ts` uses `import.meta.glob` with `{ eager: true }` at build time:

```ts
export const allGalleryImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/data/galleries/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}",
  { eager: true }
);
```

### Why `eager: true`

Astro/Vite requires that globs for images processed by `<Image />` be static and resolved at compile time. With `eager: true`, all modules are imported immediately and Vite generates the metadata (`width`, `height`, optimized `src`) for each image. Without `eager`, `ImageMetadata` would not be available to pass to the `<Image />` component.

### How images are filtered per gallery

`getGalleryImages(slug, locale, fallbackTitle)` in `src/utils/gallery.ts` filters the central `allGalleryImages` map by locale prefix and gallery folder slug, excludes `index.md`/`index.mdx`, sorts paths alphabetically, and maps each entry to `{ src, alt, filename }`. `getFirstGalleryImage(slug, locale)` returns `images[0]?.src` for fallback covers and card previews.

### Optimizations applied by Astro

The `<Image />` component with these props:

```astro
<Image
  src={img.src}
  alt={img.alt}
  widths={[400, 800]}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading={idx < 3 ? "eager" : "lazy"}
  format="avif"
  quality={72}
/>
```

Automatically generates:

- `srcset` with versions at 400 px and 800 px.
- Conversion to modern `AVIF` format at quality `72`.
- Explicit `width` and `height` to prevent layout shift (CLS).
- Lazy loading for images beyond the first ones (the initial images load `eager` for above-the-fold).

---

## Automatic alt text

When there is no explicit alt metadata, the alt text is derived from the **filename**:

```
01-sunset-in-kyoto.jpg  →  "Sunset In Kyoto"
002_fuji_mountain.png   →  "Fuji Mountain"
IMG_4532.JPG            →  "IMG 4532"  (falls back to gallery title if empty)
```

Responsible function (`filenameToAlt` in `src/utils/gallery.ts`):

```ts
export function filenameToAlt(filename: string, fallback = ""): string {
  return (
    filename
      .replace(/\.[^.]+$/, "") // remove extension
      .replace(/^\d+[-_]?/, "") // remove initial ordering numbers
      .replace(/[-_]/g, " ") // replace dashes/underscores with spaces
      .replace(/\b\w/g, c => c.toUpperCase()) // capitalize words
      .trim() || fallback
  );
}
```

---

## Cover image (coverImage)

There are two ways to define a cover:

### Option A — `coverImage` in frontmatter (recommended)

```yaml
coverImage: ./01-tokyo.jpg
```

- Astro resolves the relative path from `index.md` and optimizes it.
- If that same image already exists in the folder's photo list (`hasCoverInFolder`), it is **not shown twice** as a top banner — it only appears in the grid.
- If the image is **not** in the folder (e.g. a dedicated cover image), it is displayed as a banner at the top of the detail page.

### Option B — No `coverImage`

- The first image (alphabetically) in the folder is used as the cover in **listing cards** (`fallbackImage`).
- On the detail page there is no banner; the grid starts directly.

---

## Enable / disable and visibility flags

In `src/config.ts`:

```ts
export const SITE = {
  // ...
  showGalleries: true,         // false → disables gallery section globally
  showGalleriesInIndex: true,  // include galleries in mixed feeds (effective only when showGalleries=true)
};
```

- `showGalleries = false`:
  - `/galleries` and `/es/galleries` redirect to `/404`.
  - `buildGalleryStaticPaths(locale)` returns `[]` (no gallery detail routes generated).
  - Gallery nav links are hidden and `@astrojs/sitemap` excludes `/galleries` URLs.
  - Mixed feeds ignore galleries even if `showGalleriesInIndex` is `true`.
- `showGalleries = true` and `showGalleriesInIndex = false`:
  - `/galleries` remains available.
  - Mixed listing surfaces remain blog-only.
- `showGalleries = true` and `showGalleriesInIndex = true`:
  - Galleries are included in mixed listing surfaces.

---

## Mixed feed integration (posts + galleries)

Blog posts and galleries are unified across global listing surfaces when both flags are active:

### Affected surfaces

- `/` and `/es` (home feed)
- `/posts` and `/es/posts` (unified mixed listing)
- `/archives` and `/es/archives`
- `/tags`, `/es/tags`, `/tags/<tag>`, and `/es/tags/<tag>`
- `/rss.xml` and `/es/rss.xml`

### Implementation details

- Entries are loaded in parallel per locale with `Promise.all` and merged only when both flags are enabled.
- Shared helpers (`contentEntry`, `staticPaths`, `getSortedPosts`, `getUniqueTags`, `getPostsByTag`, `getPostsByGroupCondition`) keep route/path generation and sorting logic consistent for both collections.
- Visual differentiation:
  - `Card.astro` adds a gallery icon badge when `collection === "galleries"`.
  - `archives/index.astro` adds an inline gallery badge in timeline items.

---

## GalleryEmbed — gallery inside MDX posts

`GalleryEmbed` is a self-contained Astro component that renders the image grid of any gallery **inside the body of an MDX post**, reusing `<GalleryLightbox>`.

### Global registration

The component is registered globally in `src/layouts/PostDetails.astro` by passing `components={{ GalleryEmbed }}` to `<Content />`. Thanks to this, in **any `.mdx` file** you can use it without importing it:

```mdx
<GalleryEmbed slug="gallery-name" />
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `slug` | `string` | — | **Required.** Folder name in `src/data/galleries/{locale}/` |
| `limit` | `number` | `6` | Max images to show. `0` = all |
| `showLink` | `boolean` | `true` | Show footer link to the full gallery |
| `cols` | `2 \| 3 \| 4` | `3` | Number of grid columns |

### Usage examples in MDX

```mdx
{/* Basic usage — first 6 photos, 3 columns */}
<GalleryEmbed slug="my-trip" />

{/* Only 4 photos in 2 columns, no footer link */}
<GalleryEmbed slug="my-trip" limit={4} cols={2} showLink={false} />

{/* Show all photos */}
<GalleryEmbed slug="my-trip" limit={0} />
```

### Behavior with an invalid slug

If `slug` does not match any entry in the `galleries` collection for the active locale, the component renders a localized warning message **instead of breaking the build** (e.g. `⚠️ Gallery my-gallery not found. Verify that src/data/galleries/my-gallery/index.md exists.` or `⚠️ Galería my-gallery no encontrada. Verifica que src/data/galleries/es/my-gallery/index.md exista.`).

### Technical details

- Each `GalleryEmbed` creates its own `<GalleryLightbox id={`ge-lb-${slug}`} />` instance. This allows **multiple embeds in the same post** without conflicts.
- Trigger buttons use `data-lb={lbId}` and `data-index={idx}`, handled uniformly by `GalleryLightbox.astro` across `astro:page-load` and View Transitions.
- Images use the same `widths`, `sizes`, and `format="avif"` config as `[gallery].astro`; Astro does not duplicate optimization — if the same photo appears in both the embed and the detail page, it is processed **only once** during the build.

---

## Architecture and data flow

```
Build time
──────────────────────────────────────────────────────────────────────
src/data/galleries/{en,es}/<slug>/
    index.md          ──► "galleries" collection (Astro Content)
    *.jpg / *.png     ──► src/utils/gallery.ts (import.meta.glob eager) ──► ImageMetadata[]
                         │
              ┌─────────────────────────┴──────────────────────────┐
              │                                                    │
      /galleries & /es/galleries                          mixed feed (optional)
  (index.astro + staticPaths.ts +                      (enabled by both config flags)
       GalleryLightbox.astro)                                      │
              │                                      shared helpers (contentEntry +
      GalleryCard + detail lightbox                    sort/tag/group utilities)
        (<Image /> optimized)                                      │
              │                                                    │
              └─────────────────────────┬──────────────────────────┘
                         │
          /, /posts, /archives, /tags, /rss.xml (+ /es/*)
```

---

## Lightbox

Both the gallery detail page (`[gallery].astro`) and `GalleryEmbed.astro` share `src/components/GalleryLightbox.astro`, built with a native HTML `<dialog>` — no external dependencies.

### Behavior

| Action | Result |
| --- | --- |
| Click on image | Opens the lightbox with that image |
| `←` / `→` | Navigate between images |
| `Esc` | Close the lightbox |
| Click outside the image | Close the lightbox |
| `‹` and `›` buttons | Edge-aware navigation (prev hidden at first image, next hidden at last) |

### Technical details

- The lightbox is a standard `<dialog>` using `showModal()` / `close()`.
- Images in the lightbox reuse the processed `<img src>` rendered inside the clicked trigger button.
- Listeners are bound per `astro:page-load` with an `AbortController` and torn down on `astro:before-swap` to prevent duplicate bindings or locked `document.body.style.overflow` across View Transitions.

---

## Styles and responsive

### Listing grid (`/galleries`)

| Viewport | Columns |
| --- | --- |
| `< 640px` | 1 |
| `640px – 1023px` | 2 |
| `≥ 1024px` | 3 |

### Detail grid (`/galleries/<slug>`)

| Viewport | Columns |
| --- | --- |
| `< 640px` | 2 |
| `640px – 1023px` | 3 |
| `≥ 1024px` | 4 |

Grid styles are scoped in `[gallery].astro`, card styles in `GalleryCard.astro`, lightbox styles in `GalleryLightbox.astro`, and index hero styles are shared via `AuroraHero.astro`.

---

## Known limitations

1. **Static glob**: `import.meta.glob` requires a literal string at compile time. A single centralized glob lives in `src/utils/gallery.ts` (`allGalleryImages`) and filters per locale and slug at build runtime.
2. **Uppercase extensions**: the glob in `src/utils/gallery.ts` includes `.JPG`, `.JPEG`, `.PNG`, `.WEBP` to cover photos exported from cameras/phones. Adding a new extension only requires updating `allGalleryImages` once in `src/utils/gallery.ts`.
3. **No pagination on detail page**: if a gallery has many images (>100), all of them are rendered in the HTML. For very large galleries, pagination or infinite scroll would need to be implemented.
4. **Alt text derived from filename**: automatic via `filenameToAlt`, so non-descriptive camera names (e.g. `IMG_4532.jpg`) produce generic alt text unless explicit per-image metadata is added.
5. **Tag visibility is tied to mixed-feed flags**: gallery tags appear in `/tags` only when both `showGalleries` and `showGalleriesInIndex` are enabled.

---

## Future extensions

- `images` array field in `src/content.config.ts` frontmatter schema for explicit alt text and captions per filename.
- Query-param or static pagination on large gallery detail pages.
- Independent flags (e.g. `showGalleriesInTags`, `showGalleriesInRss`) for finer feed control.
- Pinch-to-zoom lightbox support (e.g. PhotoSwipe).
- Optional `coverVideo` URL field in `GalleryCard.astro`.
