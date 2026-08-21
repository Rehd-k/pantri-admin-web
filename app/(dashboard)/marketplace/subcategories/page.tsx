"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { paginate } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { MarketplaceCategory, MarketplaceSubcategory } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import {
  CatalogEmpty,
  CatalogSkeleton,
  PaginationBar,
  SearchField,
  ViewToggle,
  useCatalogView,
} from "@/components/cms/catalog-ui";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";

function SubcategoryCard({
  subcategory,
  categoryName,
  accentColor,
  compact = false,
}: {
  subcategory: MarketplaceSubcategory;
  categoryName: string;
  accentColor: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/marketplace/subcategories/${subcategory.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="h-8 w-8 rounded-lg" style={{ backgroundColor: accentColor }} />
        <Badge tone={subcategory.isActive ? "success" : "neutral"}>
          {subcategory.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      </div>
      <p className={`font-medium text-slate-900 group-hover:text-indigo-700 ${compact ? "text-sm" : "text-base"}`}>
        {subcategory.name}
      </p>
      <p className="mt-1 text-xs text-slate-500">{categoryName}</p>
      {!compact ? (
        <p className="mt-auto pt-3 text-xs text-slate-400">Order {subcategory.sortOrder}</p>
      ) : null}
    </Link>
  );
}

export default function SubcategoriesPage() {
  const [rows, setRows] = useState<MarketplaceSubcategory[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [view, setView] = useCatalogView();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [subs, cats] = await Promise.all([
          api.get<MarketplaceSubcategory[]>("/admin/marketplace/subcategories"),
          api.get<MarketplaceCategory[]>("/admin/marketplace/categories"),
        ]);
        if (!cancelled) {
          setRows(subs);
          setCategories(cats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load subcategories.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (categoryId && row.categoryId !== categoryId) return false;
      if (status === "active" && !row.isActive) return false;
      if (status === "inactive" && row.isActive) return false;
      if (!q) return true;
      const categoryName = categoryById.get(row.categoryId)?.name ?? "";
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q)
      );
    });
  }, [rows, debouncedSearch, categoryId, status, categoryById]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, status, pageSize]);

  const paged = paginate(filtered, page, pageSize);
  const categoryName = (id: string) => categoryById.get(id)?.name ?? id;

  const columns: Column<MarketplaceSubcategory>[] = [
    { id: "name", header: "Name", accessor: (row) => row.name },
    { id: "category", header: "Category", accessor: (row) => categoryName(row.categoryId) },
    { id: "order", header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      id: "status",
      header: "Status",
      accessor: (row) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
      ),
    },
    {
      id: "edit",
      header: "",
      accessor: (row) => (
        <Link href={`/marketplace/subcategories/${row.id}`} className="text-sm font-medium text-indigo-600">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CmsSubnav items={MARKETPLACE_NAV} />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Subcategories</h1>
          <p className="mt-1 text-sm text-slate-500">Filter by parent category, search by name, and switch between views.</p>
        </div>
        <Link href="/marketplace/subcategories/new">
          <Button>Add subcategory</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <SearchField value={search} onChange={setSearch} placeholder="Search subcategories…" />
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {filtered.length} subcategor{filtered.length === 1 ? "y" : "ies"}
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {loading ? (
          <CatalogSkeleton view={view} />
        ) : paged.total === 0 ? (
          <CatalogEmpty
            title={rows.length === 0 ? "Create the first subcategory." : "No subcategories match these filters."}
            action={
              rows.length === 0 ? (
                <Link href="/marketplace/subcategories/new">
                  <Button>Add subcategory</Button>
                </Link>
              ) : null
            }
          />
        ) : view === "table" ? (
          <DataTable columns={columns} rows={paged.slice} keyFor={(row) => row.id} />
        ) : (
          <div className={view === "grid"
            ? "grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3"}
          >
            {paged.slice.map((subcategory) => (
              <SubcategoryCard
                key={subcategory.id}
                subcategory={subcategory}
                categoryName={categoryName(subcategory.categoryId)}
                accentColor={categoryById.get(subcategory.categoryId)?.accentColor ?? "#e2e8f0"}
                compact={view === "grid"}
              />
            ))}
          </div>
        )}
        <PaginationBar
          page={paged.page}
          pageCount={paged.pageCount}
          pageSize={pageSize}
          total={paged.total}
          from={paged.from}
          to={paged.to}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
