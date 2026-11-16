import type { ImageMetadata } from "astro";

export interface GalleryImage {
  src: ImageMetadata;
  alt: string;
  filename: string;
}

/**
 * Static build-time eager glob across all image assets in galleries.
 */
export const allGalleryImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/data/galleries/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}",
  { eager: true }
);

/**
 * Converts a raw image filename (e.g. "01_golden-hour-bridge.jpg")
 * into a clean, human-readable Alt text (e.g. "Golden Hour Bridge").
 */
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

/**
 * Returns sorted GalleryImage objects ({ src, alt, filename }) for a specific gallery slug and optional locale.
 */
export function getGalleryImages(
  slug: string,
  locale?: string,
  fallbackTitle = ""
): GalleryImage[] {
  const cleanSlug = slug.replace(/^(en|es)\//, "");
  return Object.entries(allGalleryImages)
    .filter(([path]) => {
      const isMatch =
        (locale &&
          path.startsWith(`/src/data/galleries/${locale}/${cleanSlug}/`)) ||
        path.startsWith(`/src/data/galleries/${cleanSlug}/`) ||
        path.startsWith(`/src/data/galleries/${slug}/`);
      return (
        isMatch &&
        !path.endsWith("index.md") &&
        !path.endsWith("index.mdx") &&
        !path.includes("index")
      );
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, mod]) => {
      const filename = path.split("/").pop() ?? "";
      return {
        src: mod.default,
        alt: filenameToAlt(filename, fallbackTitle),
        filename,
      };
    });
}

/**
 * Returns the first image of a gallery (useful for fallback covers and card previews).
 */
export function getFirstGalleryImage(
  slug: string,
  locale?: string
): ImageMetadata | undefined {
  const images = getGalleryImages(slug, locale);
  return images[0]?.src;
}
