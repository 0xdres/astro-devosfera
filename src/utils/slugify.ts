export const slugifyStr = (str: string): string =>
  str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}.-]+/gu, "-")
    .replace(/\.+/g, ".")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));
