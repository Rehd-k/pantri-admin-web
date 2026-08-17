"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { MarketplaceBanner } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function BannersPage() {
  const [rows, setRows] = useState<MarketplaceBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const columns: Column<MarketplaceBanner>[] = [
    {
      header: "Banner",
      accessor: (row) => (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.badgeLabel}</p>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">{row.subtitle}</p>
        </div>
      ),
    },
    { header: "CTA", accessor: (row) => row.ctaLabel },
    { header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
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
        </div>
        <Link href="/marketplace/banners/new">
          <Button>Add banner</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="All banners" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading banners…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Create the first promo banner."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
