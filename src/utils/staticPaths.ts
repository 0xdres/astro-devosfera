import type { GetStaticPathsOptions } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { getGallerySlug } from "./contentEntry";
import { getPath } from "./getPath";
import getPostsByTag from "./getPostsByTag";
import getSortedPosts from "./getSortedPosts";
import getUniqueTags from "./getUniqueTags";
import postFilter from "./postFilter";

type Locale = "en" | "es";

const isMatchingLocale = (id: string, locale: Locale) =>
  id.startsWith(`${locale}/`) || (locale === "en" && !id.startsWith("es/"));

export async function buildPostStaticPaths(locale: Locale) {
  const posts = await getCollection("blog", ({ id }) =>
    isMatchingLocale(id, locale)
  );
  const sortedPosts = getSortedPosts(posts) as CollectionEntry<"blog">[];
  return sortedPosts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: { post, sortedPosts },
  }));
}

export async function buildGalleryStaticPaths(locale: Locale) {
  if (!SITE.showGalleries) return [];

  const galleries = await getCollection(
    "galleries",
    entry => isMatchingLocale(entry.id, locale) && postFilter(entry)
  );
  return galleries.map(gallery => ({
    params: { gallery: getGallerySlug(gallery.id) },
    props: { entry: gallery },
  }));
}

export async function buildTagStaticPaths(
  locale: Locale,
  paginate: GetStaticPathsOptions["paginate"]
) {
  const [blogPosts, galleryPosts] = await Promise.all([
    getCollection("blog", ({ id }) => isMatchingLocale(id, locale)),
    SITE.showGalleries && SITE.showGalleriesInIndex
      ? getCollection("galleries", ({ id }) => isMatchingLocale(id, locale))
      : Promise.resolve([]),
  ]);
  const posts = [...blogPosts, ...galleryPosts];
  const tags = getUniqueTags(posts);

  return tags.flatMap(({ tag, tagName }) =>
    paginate(getPostsByTag(posts, tag), {
      params: { tag },
      props: { tagName },
      pageSize: SITE.postPerPage,
    })
  );
}
