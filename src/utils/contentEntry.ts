import type { CollectionEntry } from "astro:content";
import { getPath } from "./getPath";

export type ContentEntry =
  | CollectionEntry<"blog">
  | CollectionEntry<"galleries">;

const isGalleryEntry = (
  entry: Pick<ContentEntry, "collection">
): entry is CollectionEntry<"galleries"> => entry.collection === "galleries";

export const getGallerySlug = (id: string) => id.replace(/\/index(?:\.(?:md|mdx))?$/, "");

export const getEntryPath = (
  entry: Pick<ContentEntry, "collection" | "id" | "filePath">
) =>
  isGalleryEntry(entry)
    ? `/galleries/${getGallerySlug(entry.id)}`
    : getPath(entry.id, entry.filePath);

export const getEntryPublishedMs = (entry: ContentEntry) => {
  const modDatetime = "modDatetime" in entry.data ? entry.data.modDatetime : null;
  return new Date(modDatetime ?? entry.data.pubDatetime).getTime();
};