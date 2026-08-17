"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { MarketplaceCategory } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function CategoriesPage() {
  const [rows, setRows] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.get<MarketplaceCategory[]>("/admin/marketplace/categories"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<MarketplaceCategory>[] = [
    {
      header: "",
      accessor: (row) =>
        row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <span
            className="inline-block h-10 w-10 rounded-lg"
            style={{ backgroundColor: row.accentColor }}
          />
        ),
    },
    { header: "Name", accessor: (row) => row.name },
    { header: "Accent", accessor: (row) => row.accentColor },
    { header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
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
          <p className="mt-1 text-sm text-slate-500">Top-level marketplace taxonomy.</p>
        </div>
        <Link href="/marketplace/categories/new">
          <Button>Add category</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="All categories" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading categories…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Create the first marketplace category."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
