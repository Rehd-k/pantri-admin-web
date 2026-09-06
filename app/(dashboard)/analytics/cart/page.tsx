"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{
    cartViews: number;
    addToCart: number;
    checkoutStarted: number;
    checkoutAbandoned: number;
    ordersSubmitted: number;
    cartToCheckoutRate: number | null;
    checkoutCompletionRate: number | null;
    abandonRate: number | null;
    behavioralNotice: string;
    funnel?: Array<{ key: string; uniqueActors: number }>;
    abandonedProducts?: Array<{ productId: string; name: string; count: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await api.get(`/admin/analytics/cart-checkout${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  const pct = (n: number | null) =>
    n == null ? "—" : `${(n * 100).toFixed(1)}%`;

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SourceBadge source="behavioral" />
            <p className="text-sm text-amber-900">{data.behavioralNotice}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader title="Cart to order funnel" /><CardBody><FunnelChart stages={data.funnel ?? []} /></CardBody></Card>
            <Card><CardHeader title="Most abandoned products" /><CardBody><DataTable columns={[{ header: "Product", accessor: (r: NonNullable<typeof data.abandonedProducts>[number]) => r.name }, { header: "Abandons", accessor: (r: NonNullable<typeof data.abandonedProducts>[number]) => r.count }]} rows={data.abandonedProducts ?? []} keyFor={(r) => r.productId} emptyMessage="No abandoned products recorded." /></CardBody></Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cart views" value={String(data.cartViews)} />
            <StatCard label="Add to cart" value={String(data.addToCart)} />
            <StatCard label="Checkout started" value={String(data.checkoutStarted)} />
            <StatCard label="Orders submitted" value={String(data.ordersSubmitted)} />
            <StatCard label="Abandoned" value={String(data.checkoutAbandoned)} />
            <StatCard label="Cart → checkout" value={pct(data.cartToCheckoutRate)} />
            <StatCard label="Checkout completion" value={pct(data.checkoutCompletionRate)} />
            <StatCard label="Abandon rate" value={pct(data.abandonRate)} />
          </div>
        </div>
      )}
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
