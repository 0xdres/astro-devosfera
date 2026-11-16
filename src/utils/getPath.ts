import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

/**
 * Get full path of a blog post
 * @param id - id of the blog post (eg: my-post.md or sub-dir/my-post.md)
 * @param filePath - full file path of the blog post (eg: src/data/blog/my-post.md)
 * @param includeBase - whether to include the base path (`/posts`) or not
 * @returns full path of the blog post (eg: `/posts/my-post` or `/posts/sub-dir/my-post`)
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  // get parent directory of the file (remove file name)
  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== "") // remove empty string in the segments
    .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
    .filter(path => path !== "en" && path !== "es") // exclude locale subdirectories en and es
    .slice(0, -1) // remove the last segment
    .map(segment => slugifyStr(segment)); // slugify each segment path

  const basePath = includeBase ? "/posts" : "";

  // if file is in the root of BLOG_PATH, return only the slug of the file
  if (!pathSegments || pathSegments.length === 0) {
    // remove language prefix from id if present (e.g. en/hello-world -> hello-world)
    const cleanId = id.replace(/^(en|es)\//, "");
    const slug = cleanId.split("/").pop() ?? cleanId;
    return `${basePath}/${slugifyStr(slug)}`;
  }

  const cleanId = id.replace(/^(en|es)\//, "");
  const slug = cleanId.split("/").pop() ?? cleanId;
  return `${basePath}/${pathSegments.join("/")}/${slugifyStr(slug)}`;
}
