export type CatalogView = "table" | "cards" | "grid";

export const CATALOG_PAGE_SIZES = [12, 24, 48] as const;
export const DEFAULT_CATALOG_PAGE_SIZE = 24;
export const CATALOG_VIEW_STORAGE_KEY = "pantri.admin.catalog.view";

export function parseCatalogView(value: string | null | undefined): CatalogView {
  if (value === "table" || value === "cards" || value === "grid") return value;
  return "cards";
}

export function readStoredCatalogView(): CatalogView {
  if (typeof window === "undefined") return "cards";
  return parseCatalogView(window.localStorage.getItem(CATALOG_VIEW_STORAGE_KEY));
}

export function persistCatalogView(view: CatalogView): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CATALOG_VIEW_STORAGE_KEY, view);
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    total,
    slice: items.slice(start, start + pageSize),
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export function pageWindow(current: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, pageCount, current - 1, current, current + 1]);
  const ordered = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (const page of ordered) {
    const prev = result[result.length - 1];
    if (typeof prev === "number" && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}
