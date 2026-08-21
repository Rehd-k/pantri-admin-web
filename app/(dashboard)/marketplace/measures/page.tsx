"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { paginate } from "@/lib/catalog";
import { unitSizeLabel } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { MeasureUnit } from "@/lib/types";
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

export default function MeasuresPage() {
  const [rows, setRows] = useState<MeasureUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dimension, setDimension] = useState("");
  const [kind, setKind] = useState("");
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
        const data = await api.get<MeasureUnit[]>("/admin/measures/units");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load units.");
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
      if (dimension && row.dimension !== dimension) return false;
      if (kind && row.kind !== kind) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.shortLabel.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, debouncedSearch, dimension, kind]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dimension, kind, pageSize]);

  const paged = paginate(filtered, page, pageSize);

  const columns: Column<MeasureUnit>[] = [
    { id: "name", header: "Unit", accessor: (row) => row.name },
    { id: "short", header: "Label", accessor: (row) => row.shortLabel },
    { id: "kind", header: "Kind", accessor: (row) => <Badge>{row.kind}</Badge> },
    {
      id: "size",
      header: "Size",
      accessor: (row) => <span className="text-xs text-slate-600">{unitSizeLabel(row)}</span>,
    },
    {
      id: "use",
      header: "Used for",
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.isRecipeUnit ? <Badge tone="info">RECIPE</Badge> : null}
          {row.isPurchaseUnit ? <Badge>PURCHASE</Badge> : null}
        </div>
      ),
    },
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
        <Link href={`/marketplace/measures/${row.id}`} className="text-sm font-medium text-indigo-600">
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
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Units of measure</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantra Cups, Pours, and any name you choose. Change the label or size here and every product using it updates.
          </p>
        </div>
        <Link href="/marketplace/measures/new">
          <Button>Add unit</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Search">
            <SearchField value={search} onChange={setSearch} placeholder="Search units…" />
          </Field>
          <Field label="Dimension">
            <Select value={dimension} onChange={(e) => setDimension(e.target.value)}>
              <option value="">All dimensions</option>
              <option value="MASS">Mass</option>
              <option value="VOLUME">Volume</option>
              <option value="COUNT">Count</option>
            </Select>
          </Field>
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All kinds</option>
              <option value="PANTRA">Pantra</option>
              <option value="METRIC">Metric</option>
              <option value="TRADITIONAL">Traditional</option>
              <option value="COUNT">Count</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {filtered.length} unit{filtered.length === 1 ? "" : "s"}
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {loading ? (
          <CatalogSkeleton view={view} />
        ) : paged.total === 0 ? (
          <CatalogEmpty
            title={rows.length === 0 ? "Create the first household unit." : "No units match these filters."}
            action={
              rows.length === 0 ? (
                <Link href="/marketplace/measures/new">
                  <Button>Add unit</Button>
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
            {paged.slice.map((unit) => (
              <Link
                key={unit.id}
                href={`/marketplace/measures/${unit.id}`}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{unit.name}</p>
                  <Badge tone={unit.isActive ? "success" : "neutral"}>
                    {unit.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{unitSizeLabel(unit)}</p>
                <p className="mt-auto pt-3 text-xs text-slate-400">{unit.kind} · {unit.shortLabel}</p>
              </Link>
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
