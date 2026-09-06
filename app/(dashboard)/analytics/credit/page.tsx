"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { DrillLink } from "@/components/analytics/DrillLink";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{
    outstandingKobo: number;
    limitKobo: number;
    utilization: number | null;
    accountCount: number;
    totalRepaymentsKobo: number;
    utilizationBands?: Array<{ bucket: string; count: number }>;
    approachingLimit?: number;
    riskIndicators?: Array<{ employeeId: string; indicators: string[]; severity: string }>;
    repayment?: { totalRepaymentsKobo: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await api.get(`/admin/analytics/credit${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <div className="mb-2">
        <SourceBadge source="business" />
      </div>
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Outstanding" value={formatNaira(data.outstandingKobo)} />
          <StatCard label="Limits" value={formatNaira(data.limitKobo)} />
          <StatCard
            label="Utilization"
            value={
              data.utilization != null
                ? `${(data.utilization * 100).toFixed(1)}%`
                : "—"
            }
          />
          <StatCard
            label="Repayments (all-time)"
            value={formatNaira(data.repayment?.totalRepaymentsKobo ?? data.totalRepaymentsKobo)}
          />
          <StatCard label="Approaching limit" value={String(data.approachingLimit ?? 0)} tone={(data.approachingLimit ?? 0) > 0 ? "danger" : "default"} />
        </div>
      )}
      {data && <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Utilization bands" /><CardBody><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.utilizationBands ?? []}><XAxis dataKey="bucket" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#047857" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></CardBody></Card>
        <Card><CardHeader title="Risk indicators" /><CardBody><DataTable columns={[
          { header: "Employee", accessor: (r) => <DrillLink type="employee" id={r.employeeId} /> },
          { header: "Indicators", accessor: (r) => r.indicators.map((item) => item.replaceAll("_", " ")).join(", ") },
          { header: "Severity", accessor: (r) => <span className="capitalize">{r.severity}</span> },
        ] as Column<NonNullable<typeof data.riskIndicators>[number]>[]} rows={data.riskIndicators ?? []} keyFor={(r) => r.employeeId} emptyMessage="No risk indicators in scope." /></CardBody></Card>
      </div>}
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
