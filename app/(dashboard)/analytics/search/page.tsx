"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

type QueryRow = { query: string; count: number; zero: number };

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{
    totalSearches: number;
    zeroResultSearches: number;
    zeroResultRate: number;
    topQueries: QueryRow[];
    behavioralNotice: string;
    unmetDemand?: QueryRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await api.get(`/admin/analytics/search${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  const columns: Column<QueryRow>[] = [
    { id: "q", header: "Query", accessor: (r) => r.query },
    { id: "c", header: "Count", accessor: (r) => String(r.count) },
    { id: "z", header: "Zero results", accessor: (r) => String(r.zero) },
  ];

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      {data && (
        <div className="space-y-4">
          <p className="text-sm text-amber-900">{data.behavioralNotice}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Searches" value={String(data.totalSearches)} hint="Behavioral" />
            <StatCard
              label="Zero-result"
              value={String(data.zeroResultSearches)}
              hint="Behavioral"
            />
            <StatCard
              label="Zero rate"
              value={`${(data.zeroResultRate * 100).toFixed(1)}%`}
              hint="Behavioral"
            />
          </div>
          {(data.unmetDemand ?? []).length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">Unmet demand</h2><p className="mt-1 text-sm text-amber-800">Customers searched without finding products. Prioritize: {(data.unmetDemand ?? []).slice(0, 6).map((row) => row.query).join(", ")}.</p></div>}
          <Card>
            <CardHeader title="Top queries" action={<SourceBadge source="behavioral" />} />
            <CardBody>
              <DataTable
                columns={columns}
                rows={data.topQueries}
                keyFor={(r) => r.query}
              />
            </CardBody>
          </Card>
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
