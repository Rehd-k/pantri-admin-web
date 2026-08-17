"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { AdminPackageListItem } from "@/lib/types";
import { CmsSubnav, PACKAGES_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function PackagesPage() {
  const [rows, setRows] = useState<AdminPackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<AdminPackageListItem[]>("/admin/packages");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load packages.");
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

  const columns: Column<AdminPackageListItem>[] = [
    {
      header: "",
      accessor: (row) =>
        row.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.coverImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          "—"
        ),
    },
    {
      header: "Package",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.itemSummary}</p>
        </div>
      ),
    },
    { header: "Total", accessor: (row) => formatNaira(row.pricing.totalKobo) },
    {
      header: "Popular",
      accessor: (row) =>
        row.isPopular ? <Badge tone="info">POPULAR</Badge> : <span className="text-slate-400">—</span>,
    },
    {
      header: "",
      accessor: (row) => (
        <Link href={`/packages/${row.id}`} className="text-sm font-medium text-indigo-600">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CmsSubnav items={PACKAGES_NAV} />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Packages</h1>
          <p className="mt-1 text-sm text-slate-500">Curated bundles shown to employees.</p>
        </div>
        <Link href="/packages/new">
          <Button>Add package</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="Curated packages" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading packages…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Create the first curated package."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
