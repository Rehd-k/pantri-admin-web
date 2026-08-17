"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { MarketplaceProduct, ProductListResponse } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function ProductsPage() {
  const [rows, setRows] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<ProductListResponse>("/admin/marketplace/products?take=500");
        if (!cancelled) setRows(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load products.");
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

  const columns: Column<MarketplaceProduct>[] = [
    {
      header: "",
      accessor: (row) =>
        // eslint-disable-next-line @next/next/no-img-element
        row.imageUrl ? <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : "—",
    },
    {
      header: "Product",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">
            {row.packs.length} pack{row.packs.length === 1 ? "" : "s"} · {row.categoryName} / {row.subcategoryName}
          </p>
        </div>
      ),
    },
    { header: "From", accessor: (row) => formatNaira(row.fromPriceKobo) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
      header: "",
      accessor: (row) => (
        <Link href={`/marketplace/products/${row.id}`} className="text-sm font-medium text-indigo-600">
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
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Products</h1>
        </div>
        <Link href="/marketplace/products/new">
          <Button>Add product</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="Catalog" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading products…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Add the first marketplace product."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
