"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { paginate } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { MarketplaceBanner } from "@/lib/types";
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

function BannerCard({
  banner,
  compact = false,
}: {
  banner: MarketplaceBanner;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/marketplace/banners/${banner.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div
        className={`relative flex flex-col justify-end p-4 text-white ${compact ? "min-h-28" : "min-h-40"}`}
        style={{ background: `linear-gradient(135deg, ${banner.gradientStart}, ${banner.gradientEnd})` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{banner.badgeLabel}</p>
        <p className={`font-semibold ${compact ? "text-sm" : "text-lg"}`}>{banner.title}</p>
        {!compact ? <p className="mt-1 line-clamp-2 text-xs text-white/80">{banner.subtitle}</p> : null}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="text-xs text-slate-500">{banner.ctaLabel}</p>
        <Badge tone={banner.isActive ? "success" : "neutral"}>
          {banner.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      </div>
    </Link>
  );
}

export default function BannersPage() {
  const [rows, setRows] = useState<MarketplaceBanner[]>([]);
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
        const data = await api.get<MarketplaceBanner[]>("/admin/marketplace/banners");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load banners.");
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
      return (
        row.title.toLowerCase().includes(q) ||
        row.subtitle.toLowerCase().includes(q) ||
        row.badgeLabel.toLowerCase().includes(q) ||
        row.ctaLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, debouncedSearch, status]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const paged = paginate(filtered, page, pageSize);

  const columns: Column<MarketplaceBanner>[] = [
    {
      id: "banner",
      header: "Banner",
      accessor: (row) => (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.badgeLabel}</p>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">{row.subtitle}</p>
        </div>
      ),
    },
    { id: "cta", header: "CTA", accessor: (row) => row.ctaLabel },
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
        <Link href={`/marketplace/banners/${row.id}`} className="text-sm font-medium text-indigo-600">
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
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Promo banners</h1>
          <p className="mt-1 text-sm text-slate-500">Preview gradients as cards, or scan the full list in a table.</p>
        </div>
        <Link href="/marketplace/banners/new">
          <Button>Add banner</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Search" className="md:col-span-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search title, badge, CTA…" />
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
            {filtered.length} banner{filtered.length === 1 ? "" : "s"}
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {loading ? (
          <CatalogSkeleton view={view} />
        ) : paged.total === 0 ? (
          <CatalogEmpty
            title={rows.length === 0 ? "Create the first promo banner." : "No banners match these filters."}
            action={
              rows.length === 0 ? (
                <Link href="/marketplace/banners/new">
                  <Button>Add banner</Button>
                </Link>
              ) : null
            }
          />
        ) : view === "table" ? (
          <DataTable columns={columns} rows={paged.slice} keyFor={(row) => row.id} />
        ) : (
          <div className={view === "grid"
            ? "grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4"
            : "grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3"}
          >
            {paged.slice.map((banner) => (
              <BannerCard key={banner.id} banner={banner} compact={view === "grid"} />
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
