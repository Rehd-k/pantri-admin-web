"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { MarketplaceCategory, MarketplaceSubcategory } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function SubcategoriesPage() {
  const [rows, setRows] = useState<MarketplaceSubcategory[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const columns: Column<MarketplaceSubcategory>[] = [
    { header: "Name", accessor: (row) => row.name },
    { header: "Category", accessor: (row) => categoryName(row.categoryId) },
    { header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
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
        </div>
        <Link href="/marketplace/subcategories/new">
          <Button>Add subcategory</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="All subcategories" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading subcategories…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Create the first subcategory."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
