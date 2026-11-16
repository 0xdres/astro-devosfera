import assert from "node:assert/strict";
import test from "node:test";
import { getTargetLanguageUrl, isActive } from "@/i18n/utils";
import { buildBreadcrumbItems } from "@/utils/breadcrumbs";
import { getPath } from "@/utils/getPath";
import postFilter from "@/utils/postFilter";
import { getReadingTime } from "@/utils/readingTime";
import type { ContentEntry } from "@/utils/contentEntry";
import { slugifyAll, slugifyStr } from "@/utils/slugify";

test("slugifyStr normalizes diacritics, versions, punctuation, and unicode", () => {
  assert.equal(slugifyStr("E2E Testing"), "e2e-testing");
  assert.equal(slugifyStr("TypeScript 5.0"), "typescript-5.0");
  assert.equal(slugifyStr("Programación y Diseño's"), "programacion-y-disenos");
  assert.equal(
    slugifyStr("Modern CSS in 2026: :has()"),
    "modern-css-in-2026-has"
  );
  assert.equal(slugifyStr("日本語 テスト"), "日本語-テスト");
  assert.deepEqual(slugifyAll(["Astro 7", "Web Dev"]), ["astro-7", "web-dev"]);
});

test("getReadingTime strips frontmatter/code and formats by locale", () => {
  assert.equal(getReadingTime(""), "< 1 min read");
  assert.equal(getReadingTime("", "es"), "< 1 min de lectura");
  assert.equal(getReadingTime("word ".repeat(400)), "2 min read");
  assert.equal(getReadingTime("palabra ".repeat(400), "es"), "2 min de lectura");

  const withCode = `---
title: Demo
---

\`\`\`ts
${"const x = 1;\n".repeat(300)}
\`\`\`

Just a short \`inlineCode()\` paragraph here.`;
  assert.equal(getReadingTime(withCode), "1 min read");
});

test("i18n helpers switch locale prefixes and match active routes", () => {
  assert.equal(getTargetLanguageUrl("/", "es"), "/es");
  assert.equal(getTargetLanguageUrl("/posts/hello", "es"), "/es/posts/hello");
  assert.equal(getTargetLanguageUrl("/es", "en"), "/");
  assert.equal(getTargetLanguageUrl("/es/posts/hello", "en"), "/posts/hello");

  assert.equal(isActive("/es/posts/my-article/", "/posts"), true);
  assert.equal(isActive("/archives/", "/posts"), false);
});

test("buildBreadcrumbItems translates segments and compacts pagination", () => {
  assert.deepEqual(buildBreadcrumbItems("/"), []);
  assert.deepEqual(buildBreadcrumbItems("/es/posts/2", { locale: "es" }), [
    { label: "Publicaciones #2", href: null },
  ]);
  assert.deepEqual(buildBreadcrumbItems("/tags/astro-v7"), [
    { label: "Tags", href: "/tags/" },
    { label: "Astro v7", href: null },
  ]);
});

test("getPath skips _-prefixed dirs and slugifies nested subdirectories", () => {
  assert.equal(
    getPath("en/hello-world", "src/data/blog/en/hello-world.mdx", false),
    "/hello-world"
  );
  assert.equal(
    getPath("en/_2026/draft-note", "src/data/blog/en/_2026/draft-note.md", false),
    "/draft-note"
  );
  assert.equal(
    getPath("es/Web Dev/mi-post", "src/data/blog/es/Web Dev/mi-post.mdx", true),
    "/posts/web-dev/mi-post"
  );
});

test("postFilter hides drafts and scheduled future posts", () => {
  const entry = (overrides: Record<string, unknown>) =>
    ({ data: { title: "t", description: "d", pubDatetime: new Date(0), ...overrides } }) as ContentEntry;

  assert.equal(postFilter(entry({ draft: true })), false);
  assert.equal(postFilter(entry({ pubDatetime: new Date(Date.now() + 86_400_000) })), false);
  assert.equal(postFilter(entry({ pubDatetime: new Date(Date.now() - 86_400_000) })), true);
});
