export type BreadcrumbItem = {
  label: string;
  href: string | null;
};

type BuildBreadcrumbOptions = {
  locale?: string;
  compactNumericPagination?: boolean;
};

const isNumericSegment = (value?: string) =>
  typeof value === "string" && /^\d+$/.test(value);

const normalizePathname = (pathname: string) =>
  pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

const decodeSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const translations: Record<string, Record<string, string>> = {
  es: {
    posts: "Publicaciones",
    tags: "Etiquetas",
    about: "Sobre mí",
    search: "Buscar",
    archives: "Archivo",
    galleries: "Galerías",
  },
};

export const formatPathSegmentLabel = (segment: string, locale?: string) => {
  const normalizedLocale = locale
    ? locale.toLowerCase().split("-")[0]
    : undefined;
  const lowerSegment = segment.toLowerCase();

  if (normalizedLocale && translations[normalizedLocale]?.[lowerSegment]) {
    return translations[normalizedLocale][lowerSegment];
  }

  const readable = decodeSegment(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!readable) return segment;

  return readable.charAt(0).toLocaleUpperCase(locale) + readable.slice(1);
};

export const getPathSegments = (pathname: string) => {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] === "es") {
    return segments.slice(1);
  }
  return segments;
};

const buildDefaultBreadcrumbItems = (
  segments: string[],
  locale?: string
): BreadcrumbItem[] => {
  const prefix = locale === "es" ? "/es" : "";
  return segments.map((segment, index) => ({
    label: formatPathSegmentLabel(segment, locale),
    href:
      index === segments.length - 1
        ? null
        : `${prefix}/${segments.slice(0, index + 1).join("/")}/`,
  }));
};

const compactPagination = (
  items: BreadcrumbItem[],
  pageSegment: string
): BreadcrumbItem[] => {
  if (items.length === 0) {
    return [{ label: `#${pageSegment}`, href: null }];
  }

  const compacted = [...items];
  const lastIndex = compacted.length - 1;
  const currentLabel = compacted[lastIndex]?.label;

  if (!currentLabel) {
    compacted[lastIndex] = { label: `#${pageSegment}`, href: null };
    return compacted;
  }

  compacted[lastIndex] = {
    label: `${currentLabel} #${pageSegment}`,
    href: null,
  };

  return compacted;
};

export const buildBreadcrumbItems = (
  pathname: string,
  options: BuildBreadcrumbOptions = {}
): BreadcrumbItem[] => {
  const { locale, compactNumericPagination: shouldCompactPagination = true } =
    options;

  const segments = getPathSegments(pathname);
  if (segments.length === 0) return [];

  if (shouldCompactPagination && isNumericSegment(segments.at(-1))) {
    const pageSegment = segments.at(-1) as string;
    const parentSegments = segments.slice(0, -1);
    const parentItems = buildDefaultBreadcrumbItems(parentSegments, locale);

    return compactPagination(parentItems, pageSegment);
  }

  return buildDefaultBreadcrumbItems(segments, locale);
};
