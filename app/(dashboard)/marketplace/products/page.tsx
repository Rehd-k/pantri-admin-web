"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { nairaToKobo } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  CATALOG_PAGE_SIZES,
  DEFAULT_CATALOG_PAGE_SIZE,
} from "@/lib/catalog";
import type {
  MarketplaceCategory,
  MarketplaceProduct,
  MarketplaceSubcategory,
  ProductListResponse,
} from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import {
  CatalogEmpty,
  CatalogProgress,
  CatalogSkeleton,
  PaginationBar,
  SearchField,
  ViewToggle,
  useCatalogView,
} from "@/components/cms/catalog-ui";
import { ProductCards, ProductTable } from "@/components/cms/product-views";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";

const SORT_OPTIONS = [
  { value: "catalog", label: "Catalog order", sort: "sortOrder", order: "asc" },
  { value: "nameAsc", label: "Name A–Z", sort: "name", order: "asc" },
  { value: "nameDesc", label: "Name Z–A", sort: "name", order: "desc" },
  { value: "newest", label: "Newest", sort: "createdAt", order: "desc" },
  { value: "updated", label: "Recently updated", sort: "updatedAt", order: "desc" },
] as const;

function firstParam(value: string | null): string {
  return value ?? "";
}

function ProductsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = firstParam(searchParams.get("q"));
  const categoryId = firstParam(searchParams.get("categoryId"));
  const subcategoryId = firstParam(searchParams.get("subcategoryId"));
  const status = firstParam(searchParams.get("status"));
  const verified = firstParam(searchParams.get("verified"));
  const packs = firstParam(searchParams.get("packs"));
  const originParam = firstParam(searchParams.get("origin"));
  const minPriceParam = firstParam(searchParams.get("minPrice"));
  const maxPriceParam = firstParam(searchParams.get("maxPrice"));
  const sortKey = firstParam(searchParams.get("sort")) || "catalog";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const rawTake = Number(searchParams.get("take") ?? DEFAULT_CATALOG_PAGE_SIZE);
  const take = (CATALOG_PAGE_SIZES as readonly number[]).includes(rawTake)
    ? rawTake
    : DEFAULT_CATALOG_PAGE_SIZE;
  const [view, setView] = useCatalogView();
  const [searchInput, setSearchInput] = useState(qParam);
  const [originInput, setOriginInput] = useState(originParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);
  const debouncedSearch = useDebouncedValue(searchInput);
  const debouncedOrigin = useDebouncedValue(originInput);
  const debouncedMinPrice = useDebouncedValue(minPriceInput);
  const debouncedMaxPrice = useDebouncedValue(maxPriceInput);

  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MarketplaceSubcategory[]>([]);
  const [items, setItems] = useState<MarketplaceProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const updateParams = useCallback(
    (patch: Record<string, string | null>, replace = true) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    setOriginInput(originParam);
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [originParam, minPriceParam, maxPriceParam]);

  useEffect(() => {
    const patch: Record<string, string | null> = {};
    if (debouncedSearch !== qParam) {
      patch.q = debouncedSearch.trim() || null;
      patch.page = "1";
    }
    if (debouncedOrigin !== originParam) {
      patch.origin = debouncedOrigin.trim() || null;
      patch.page = "1";
    }
    if (debouncedMinPrice !== minPriceParam) {
      patch.minPrice = debouncedMinPrice.trim() || null;
      patch.page = "1";
    }
    if (debouncedMaxPrice !== maxPriceParam) {
      patch.maxPrice = debouncedMaxPrice.trim() || null;
      patch.page = "1";
    }
    if (Object.keys(patch).length > 0) updateParams(patch);
  }, [
    debouncedSearch,
    debouncedOrigin,
    debouncedMinPrice,
    debouncedMaxPrice,
    qParam,
    originParam,
    minPriceParam,
    maxPriceParam,
    updateParams,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadLookups() {
      try {
        const [cats, subs] = await Promise.all([
          api.get<MarketplaceCategory[]>("/admin/marketplace/categories"),
          api.get<MarketplaceSubcategory[]>("/admin/marketplace/subcategories"),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setSubcategories(subs);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setSubcategories([]);
        }
      }
    }
    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSubcategories = useMemo(
    () => (categoryId ? subcategories.filter((row) => row.categoryId === categoryId) : subcategories),
    [categoryId, subcategories],
  );

  useEffect(() => {
    if (!subcategoryId) return;
    const match = subcategories.find((row) => row.id === subcategoryId);
    if (match && categoryId && match.categoryId !== categoryId) {
      updateParams({ subcategoryId: null, page: "1" });
    }
  }, [categoryId, subcategoryId, subcategories, updateParams]);

  useEffect(() => {
    let cancelled = false;
    const sort = SORT_OPTIONS.find((option) => option.value === sortKey) ?? SORT_OPTIONS[0];
    const query = new URLSearchParams();
    if (qParam.trim()) query.set("q", qParam.trim());
    if (categoryId) query.set("categoryId", categoryId);
    if (subcategoryId) query.set("subcategoryId", subcategoryId);
    if (status === "active") query.set("isActive", "true");
    if (status === "inactive") query.set("isActive", "false");
    if (verified === "yes") query.set("isVerified", "true");
    if (verified === "no") query.set("isVerified", "false");
    if (packs === "yes") query.set("hasPacks", "true");
    if (packs === "no") query.set("hasPacks", "false");
    if (originParam.trim()) query.set("origin", originParam.trim());
    const minKobo = nairaToKobo(minPriceParam);
    const maxKobo = nairaToKobo(maxPriceParam);
    if (minKobo !== null) query.set("minPriceKobo", String(minKobo));
    if (maxKobo !== null) query.set("maxPriceKobo", String(maxKobo));
    query.set("sort", sort.sort);
    query.set("order", sort.order);
    query.set("skip", String((page - 1) * take));
    query.set("take", String(take));

    async function load() {
      if (!hasLoaded.current) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const data = await api.get<ProductListResponse>(
          `/admin/marketplace/products?${query.toString()}`,
        );
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          hasLoaded.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load products.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, categoryId, subcategoryId, status, verified, packs, originParam, minPriceParam, maxPriceParam, sortKey, page, take]);

  const pageCount = Math.max(1, Math.ceil(total / take));
  const from = total === 0 ? 0 : (page - 1) * take + 1;
  const to = Math.min(page * take, total);

  useEffect(() => {
    if (hasLoaded.current && page > pageCount) {
      updateParams({ page: String(pageCount) });
    }
  }, [page, pageCount, updateParams]);
  const hasFilters = Boolean(
    qParam ||
      categoryId ||
      subcategoryId ||
      status ||
      verified ||
      packs ||
      originParam ||
      minPriceParam ||
      maxPriceParam ||
      sortKey !== "catalog",
  );

  function clearFilters() {
    setSearchInput("");
    setOriginInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    updateParams({
      q: null,
      categoryId: null,
      subcategoryId: null,
      status: null,
      verified: null,
      packs: null,
      origin: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      page: "1",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CmsSubnav items={MARKETPLACE_NAV} />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Marketplace catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and browse every product as a table, card list, or dense grid.
          </p>
        </div>
        <Link href="/marketplace/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-4">
          <Field label="Search" className="lg:col-span-2">
            <SearchField
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Name, brand, SKU, tag, category…"
            />
          </Field>
          <Field label="Category">
            <Select
              value={categoryId}
              onChange={(e) =>
                updateParams({
                  categoryId: e.target.value || null,
                  subcategoryId: null,
                  page: "1",
                })
              }
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subcategory">
            <Select
              value={subcategoryId}
              onChange={(e) =>
                updateParams({ subcategoryId: e.target.value || null, page: "1" })
              }
            >
              <option value="">All subcategories</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value || null, page: "1" })}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Verified">
            <Select
              value={verified}
              onChange={(e) => updateParams({ verified: e.target.value || null, page: "1" })}
            >
              <option value="">All products</option>
              <option value="yes">Verified only</option>
              <option value="no">Unverified</option>
            </Select>
          </Field>
          <Field label="Packs">
            <Select
              value={packs}
              onChange={(e) => updateParams({ packs: e.target.value || null, page: "1" })}
            >
              <option value="">Any pack state</option>
              <option value="yes">Has packs</option>
              <option value="no">Missing packs</option>
            </Select>
          </Field>
          <Field label="Sort">
            <Select
              value={sortKey}
              onChange={(e) => updateParams({ sort: e.target.value === "catalog" ? null : e.target.value, page: "1" })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Origin">
            <Input
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              placeholder="Nigeria, Thailand…"
            />
          </Field>
          <Field label="Min price (₦)">
            <Input
              inputMode="decimal"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Max price (₦)">
            <Input
              inputMode="decimal"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder="Any"
            />
          </Field>
          <div className="flex items-end">
            {hasFilters ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <p className="pb-2 text-xs text-slate-400">Filters apply as you type.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="relative overflow-hidden">
        <CatalogProgress visible={refreshing} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {total} product{total === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-slate-500">
              {refreshing ? "Updating results…" : "Switch views without losing filters or page."}
            </p>
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
        <div className={refreshing ? "opacity-70 transition-opacity" : "transition-opacity"} aria-busy={loading || refreshing}>
          {loading ? (
            <CatalogSkeleton view={view} />
          ) : items.length === 0 ? (
            <CatalogEmpty
              title={hasFilters ? "No products match these filters." : "Add the first marketplace product."}
              hint={hasFilters ? "Clear a filter or try a broader search." : "Products appear here with prices, packs, and taxonomy."}
              action={
                hasFilters ? (
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Link href="/marketplace/products/new">
                    <Button>Add product</Button>
                  </Link>
                )
              }
            />
          ) : view === "table" ? (
            <ProductTable products={items} />
          ) : (
            <ProductCards products={items} compact={view === "grid"} />
          )}
        </div>
        <PaginationBar
          page={page}
          pageCount={pageCount}
          pageSize={take}
          total={total}
          from={from}
          to={to}
          disabled={loading}
          onPageChange={(next) => updateParams({ page: String(next) })}
          onPageSizeChange={(size) => updateParams({ take: String(size), page: "1" })}
        />
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton view="cards" />}>
      <ProductsCatalog />
    </Suspense>
  );
}
