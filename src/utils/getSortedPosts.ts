import type { ContentEntry } from "./contentEntry";
import { getEntryPublishedMs } from "./contentEntry";
import postFilter from "./postFilter";

const getSortedPosts = (posts: ContentEntry[]) =>
  posts
    .filter(postFilter)
    .map(post => ({ post, publishedMs: getEntryPublishedMs(post) }))
    .sort((a, b) => b.publishedMs - a.publishedMs)
    .map(({ post }) => post);

export default getSortedPosts;
