import type { ContentEntry } from "./contentEntry";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

const getUniqueTags = (posts: ContentEntry[]) => {
  const tagMap = new Map<string, string>();

  for (const post of posts) {
    if (!postFilter(post)) continue;

    for (const tagName of post.data.tags) {
      const tag = slugifyStr(tagName);
      if (!tagMap.has(tag)) tagMap.set(tag, tagName);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, tagName]) => ({ tag, tagName }))
    .sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
};

export default getUniqueTags;
