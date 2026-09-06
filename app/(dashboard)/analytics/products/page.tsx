"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

type Row = {
  productId: string;
  name: string;
  unitsSold: number;
  revenueKobo: number;
  views: number;
  classification?: string;
  conversionRate?: number | null;
  category?: string | null;
};

function Inner() {
  const q = useAnalyticsQuery();
  const [rows, setRows] = useState<Row[]>([]);
  const [pairs, setPairs] = useState<Array<{ firstProductId: string; firstProductName: string; secondProductId: string; secondProductName: string; orderCount: number }>>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: string; category: string; unitsSold: number; revenueKobo: number; views: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.get<{ products: Row[]; frequentlyBoughtTogether?: typeof pairs; categories?: typeof categories }>(`/admin/analytics/products${q}`);
        setRows(data.products);
        setPairs(data.frequentlyBoughtTogether ?? []);
        setCategories(data.categories ?? []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  const columns: Column<Row>[] = [
    { id: "name", header: "Product", accessor: (r) => r.name },
    { id: "units", header: "Units", accessor: (r) => String(r.unitsSold) },
    {
      id: "revenue",
      header: "Revenue",
      accessor: (r) => formatNaira(r.revenueKobo),
    },
    { id: "views", header: "Views", accessor: (r) => String(r.views) },
    { id: "conversion", header: "Conversion", accessor: (r) => r.conversionRate == null ? "—" : `${(r.conversionRate * 100).toFixed(1)}%` },
    { id: "class", header: "Classification", accessor: (r) => <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{(r.classification ?? "normal").replaceAll("_", " ")}</span> },
  ];

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader title="Product performance" subtitle="Sales = business · Views = behavioral" />
        <CardBody>
          <DataTable columns={columns} rows={rows} keyFor={(r) => r.productId} />
        </CardBody>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Frequently bought together" /><CardBody><DataTable columns={[{ header: "Products", accessor: (r: typeof pairs[number]) => `${r.firstProductName} + ${r.secondProductName}` }, { header: "Orders", accessor: (r: typeof pairs[number]) => r.orderCount }]} rows={pairs} keyFor={(r) => `${r.firstProductId}-${r.secondProductId}`} emptyMessage="No product pairs yet." /></CardBody></Card>
        <Card><CardHeader title="Category performance" /><CardBody><DataTable columns={[{ header: "Category", accessor: (r: typeof categories[number]) => r.category }, { header: "Revenue", accessor: (r: typeof categories[number]) => formatNaira(r.revenueKobo) }, { header: "Units", accessor: (r: typeof categories[number]) => r.unitsSold }, { header: "Views", accessor: (r: typeof categories[number]) => r.views }]} rows={categories} keyFor={(r) => r.categoryId} emptyMessage="No category performance yet." /></CardBody></Card>
      </div>
    </AnalyticsNav>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <Inner />
    </Suspense>
  );
}
