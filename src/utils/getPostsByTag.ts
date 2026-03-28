import type { ContentEntry } from "./contentEntry";
import getSortedPosts from "./getSortedPosts";
import { slugifyAll } from "./slugify";

const getPostsByTag = (posts: ContentEntry[], tag: string) =>
  getSortedPosts(
    posts.filter(post => slugifyAll(post.data.tags).includes(tag))
  );

export default getPostsByTag;
