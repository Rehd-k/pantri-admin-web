"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { paginate } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { MarketplaceCategory } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import {
  CatalogEmpty,
  CatalogImage,
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

function CategoryCard({
  category,
  compact = false,
}: {
  category: MarketplaceCategory;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/marketplace/categories/${category.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className={`relative ${compact ? "h-28" : "h-40"}`} style={{ backgroundColor: category.accentColor }}>
        <CatalogImage src={category.imageUrl} alt={category.name} className="h-full w-full" />
        <div className="absolute left-2 top-2">
          <Badge tone={category.isActive ? "success" : "neutral"}>
            {category.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <p className={`font-medium text-slate-900 group-hover:text-indigo-700 ${compact ? "text-sm" : "text-base"}`}>
          {category.name}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Order {category.sortOrder} · {category.accentColor}
        </p>
      </div>
    </Link>
  );
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
        const data = await api.get<MarketplaceCategory[]>("/admin/marketplace/categories");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load categories.");
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

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === "active" && !row.isActive) return false;
      if (status === "inactive" && row.isActive) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q);
    });
  }, [rows, debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const paged = paginate(filtered, page, pageSize);

  const columns: Column<MarketplaceCategory>[] = [
    {
      id: "image",
      header: "",
      accessor: (row) =>
        row.imageUrl ? (
          <CatalogImage src={row.imageUrl} alt={row.name} className="h-10 w-10 rounded-lg" />
        ) : (
          <span className="inline-block h-10 w-10 rounded-lg" style={{ backgroundColor: row.accentColor }} />
        ),
    },
    { id: "name", header: "Name", accessor: (row) => row.name },
    { id: "accent", header: "Accent", accessor: (row) => row.accentColor },
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
        <Link href={`/marketplace/categories/${row.id}`} className="text-sm font-medium text-indigo-600">
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
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Top-level marketplace taxonomy, searchable and viewable as cards or a table.</p>
        </div>
        <Link href="/marketplace/categories/new">
          <Button>Add category</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Search" className="md:col-span-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search categories…" />
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
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
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {loading ? (
          <CatalogSkeleton view={view} />
        ) : paged.total === 0 ? (
          <CatalogEmpty
            title={rows.length === 0 ? "Create the first marketplace category." : "No categories match these filters."}
            action={
              rows.length === 0 ? (
                <Link href="/marketplace/categories/new">
                  <Button>Add category</Button>
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
            {paged.slice.map((category) => (
              <CategoryCard key={category.id} category={category} compact={view === "grid"} />
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
