"use client";

import { Suspense, useEffect, useState } from "react";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";
import { Scorecard } from "@/components/analytics/Scorecard";
import type { AnalyticsMetric } from "@/components/analytics/MetricDelta";
import { InsightCard } from "@/components/analytics/InsightCard";
import { HowToUse } from "@/components/analytics/HowToUse";
import Link from "next/link";
import { Line } from "recharts";

type Overview = {
  collectionStartedAt: string | null;
  behavioralNotice: string;
  business: {
    revenueKobo: number;
    orderCount: number;
    aovKobo: number;
    employeeCount: number;
    repeatPurchasers: number;
  };
  behavioral: {
    activeUsers: number;
    dauSeries: Array<{ date: string; dau: number }>;
  };
  scorecard: AnalyticsMetric[];
  whatChanged: { narrative: string; drivers: Array<{ label?: string; contributionNote?: string; key?: string }> };
  insights: Array<{ id: string; title: string; body: string; severity: string; href: string }>;
  series: { revenue: Array<{ date: string; value: number }>; dau: Array<{ date: string; dau?: number; value?: number }> };
};

function OverviewInner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        setData(await api.get<Overview>(`/admin/analytics/overview${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load overview");
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner label="Loading analytics…" />
      ) : data ? (
        <div className="space-y-6">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {data.behavioralNotice}
          </p>
          <Card><CardHeader title="What changed" subtitle="Compared with the selected comparison period" /><CardBody><p className="text-lg font-medium text-slate-900">{data.whatChanged?.narrative || "No material change detected."}</p><ul className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">{(data.whatChanged?.drivers ?? []).map((driver, index) => <li key={driver.key ?? index} className="rounded-lg bg-slate-50 p-3">{driver.contributionNote ?? driver.label ?? driver.key}</li>)}</ul></CardBody></Card>
          {(data.insights ?? []).length > 0 && <section><h2 className="mb-3 text-sm font-semibold text-slate-900">Priority insights</h2><div className="grid gap-4 lg:grid-cols-3">{data.insights.map((insight) => <InsightCard key={insight.id} {...insight} />)}</div></section>}
          <Scorecard metrics={data.scorecard ?? []} />
          <Card>
            <CardHeader
              title="Revenue and daily active users"
              subtitle="Commercial performance alongside engagement"
            />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(data.series?.revenue ?? []).map((row) => ({ ...row, dau: data.series?.dau.find((item) => item.date === row.date)?.dau ?? data.series?.dau.find((item) => item.date === row.date)?.value ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide={data.behavioral.dauSeries.length > 14} />
                    <YAxis yAxisId="revenue" hide />
                    <YAxis yAxisId="dau" orientation="right" allowDecimals={false} />
                    <Tooltip />
                    <Bar yAxisId="revenue" dataKey="value" fill="#047857" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="dau" type="monotone" dataKey="dau" stroke="#334155" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
          <HowToUse tells="A single executive view of growth, commerce, credit, payroll and customer behavior." watch="Sustained negative deltas, revenue changes without engagement changes, and high-severity insights." actions="Open the linked insight, narrow by employer or segment, then export the evidence for review." />
          <Link href={`/analytics/intelligence?tab=why${q ? `&${q.slice(1)}` : ""}`} className="inline-flex text-sm font-semibold text-emerald-700">Why did revenue change? →</Link>
        </div>
      ) : null}
    </AnalyticsNav>
  );
}

export default function AnalyticsOverviewPage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <OverviewInner />
    </Suspense>
  );
}
