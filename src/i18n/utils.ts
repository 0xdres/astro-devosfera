import { ui, defaultLang, type Lang } from "./ui";

export function useTranslations(lang?: string | null) {
  const validLang: Lang = lang && lang in ui ? (lang as Lang) : defaultLang;
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[validLang][key] || ui[defaultLang][key];
  };
}

export function getTargetLanguageUrl(pathname: string, targetLocale: string) {
  let path = pathname;
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // Strip existing locale prefix
  if (path.startsWith("/es/") || path === "/es") {
    path = path.slice(3);
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
  }

  // Prepend new locale if not default
  if (targetLocale === "es") {
    return `/es${path === "/" ? "" : path}`;
  }
  return path;
}

/**
 * Checks whether a navigation route is active given the current pathname and target route.
 * Handles trailing slashes, locale prefixes (/es/), and matches by exact path or root segment.
 */
export function isActive(currentPath: string, targetPath: string): boolean {
  let normalizedCurrent =
    currentPath.endsWith("/") && currentPath !== "/"
      ? currentPath.slice(0, -1)
      : currentPath;

  if (normalizedCurrent.startsWith("/es/") || normalizedCurrent === "/es") {
    normalizedCurrent = normalizedCurrent.slice(3) || "/";
  }

  const currentPathArray = normalizedCurrent.split("/").filter(p => p.trim());
  const targetPathArray = targetPath.split("/").filter(p => p.trim());

  return (
    normalizedCurrent === targetPath ||
    (currentPathArray.length > 0 && currentPathArray[0] === targetPathArray[0])
  );
}
