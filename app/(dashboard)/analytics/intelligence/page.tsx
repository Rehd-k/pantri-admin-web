"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";
import { CohortHeatmap } from "@/components/analytics/CohortHeatmap";
import { HowToUse } from "@/components/analytics/HowToUse";
import { DrillLink } from "@/components/analytics/DrillLink";

function Inner() {
  const q = useAnalyticsQuery();
  const [rfm, setRfm] = useState<{
    segments: Record<string, number>;
    customers: Array<{
      employeeId: string;
      segment: string;
      score: number;
      monetaryKobo: number;
      frequency: number;
      recencyDays: number;
    }>;
  } | null>(null);
  const [clv, setClv] = useState<{
    averageEstimatedClvKobo: number;
    customers: Array<{ employeeId: string; estimatedClvKobo: number; historicalLifetimeKobo: number; estimateLabel: string }>;
  } | null>(null);
  const [cohorts, setCohorts] = useState<{
    cohorts: Array<{ cohortMonth?: string; cohortWeek?: string; size: number; retainedRates: number[] }>;
  } | null>(null);
  const [anomalies, setAnomalies] = useState<{
    whatChanged: {
      revenueDeltaKobo: number;
      orderDelta: number;
      activeUserDelta: number;
    };
    anomalies: Array<{ date: string; revenueKobo: number; zScore: number }>;
  } | null>(null);
  const [opportunities, setOpportunities] = useState<
    Array<{ id: string; title: string; why: string; severity: string }>
  >([]);
  const [demand, setDemand] = useState<
    Array<{ productId: string; name: string; unitsSold: number; demandSignal: string }>
  >([]);
  const [why, setWhy] = useState<{ narrative?: string; drivers?: Array<{ label?: string; value?: number; delta?: number }> } | null>(null);
  const [retention, setRetention] = useState<{ activity: Array<{ days: number; rate: number | null }>; purchase: Array<{ days: number; rate: number | null }>; methodology: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [r, c, co, a, o, d, w, rt] = await Promise.all([
          api.get(`/admin/analytics/rfm${q}`),
          api.get(`/admin/analytics/clv${q}`),
          api.get(`/admin/analytics/cohorts${q}`),
          api.get(`/admin/analytics/what-changed${q}`),
          api.get<{ opportunities: typeof opportunities }>(
            `/admin/analytics/opportunities${q}`,
          ),
          api.get<{ demand: typeof demand }>(`/admin/analytics/inventory-demand${q}`),
          api.get(`/admin/analytics/why${q}`),
          api.get(`/admin/analytics/retention${q}`),
        ]);
        setRfm(r as typeof rfm);
        setClv(c as typeof clv);
        setCohorts(co as typeof cohorts);
        setAnomalies(a as typeof anomalies);
        setOpportunities(o.opportunities);
        setDemand(d.demand.slice(0, 20));
        setWhy(w as typeof why);
        setRetention(rt as typeof retention);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load intelligence");
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  const rfmColumns: Column<NonNullable<typeof rfm>["customers"][number]>[] = [
    { id: "id", header: "Employee", accessor: (r) => <DrillLink type="employee" id={r.employeeId} /> },
    { id: "seg", header: "Segment", accessor: (r) => r.segment },
    { id: "score", header: "Score", accessor: (r) => String(r.score) },
    { id: "f", header: "Freq", accessor: (r) => String(r.frequency) },
    { id: "m", header: "Monetary", accessor: (r) => formatNaira(r.monetaryKobo) },
    { id: "rec", header: "Recency (d)", accessor: (r) => String(r.recencyDays) },
  ];

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner label="Loading intelligence…" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <SourceBadge source="business" />
            <span className="text-sm text-slate-500">
              RFM / CLV / cohorts from orders · opportunities mix behavioral signals
            </span>
          </div>
          <Card><CardHeader title="Why performance changed" subtitle="Decomposition of the selected metric" /><CardBody><p className="text-sm leading-6 text-slate-700">{why?.narrative ?? "Use the drivers below to investigate movement against the comparison period."}</p><div className="mt-3 flex flex-wrap gap-2">{(why?.drivers ?? []).map((driver, index) => <span key={driver.label ?? index} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">{driver.label ?? `Driver ${index + 1}`}</span>)}</div></CardBody></Card>

          {anomalies?.whatChanged && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Revenue Δ (half vs half)"
                value={formatNaira(anomalies.whatChanged.revenueDeltaKobo)}
              />
              <StatCard
                label="Orders Δ"
                value={String(anomalies.whatChanged.orderDelta)}
              />
              <StatCard
                label="Active users Δ"
                value={String(anomalies.whatChanged.activeUserDelta)}
              />
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="RFM segments" />
              <CardBody>
                <ul className="mb-4 flex flex-wrap gap-2 text-sm">
                  {Object.entries(rfm?.segments ?? {}).map(([k, v]) => (
                    <li key={k} className="rounded bg-slate-100 px-2 py-1">
                      {k}: {v}
                    </li>
                  ))}
                </ul>
                <DataTable
                  columns={rfmColumns}
                  rows={(rfm?.customers ?? []).slice(0, 25)}
                  keyFor={(r) => r.employeeId}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="Customer lifetime value"
                subtitle={`Avg estimated ${formatNaira(clv?.averageEstimatedClvKobo ?? 0)}`}
              />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {(clv?.customers ?? []).slice(0, 15).map((c) => (
                    <li key={c.employeeId} className="flex justify-between border-b border-slate-100 py-1">
                      <DrillLink type="employee" id={c.employeeId} />
                      <span>{formatNaira(c.estimatedClvKobo)}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Purchase cohorts (weekly retention)" />
            <CardBody><CohortHeatmap cohorts={cohorts?.cohorts ?? []} /></CardBody>
          </Card>
          <Card><CardHeader title="Retention" subtitle={retention?.methodology} /><CardBody className="grid gap-3 sm:grid-cols-4">{(retention?.activity ?? []).map((row) => <div key={row.days} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{row.days}-day activity</p><p className="mt-1 text-xl font-semibold">{row.rate == null ? "—" : `${(row.rate * 100).toFixed(1)}%`}</p></div>)}</CardBody></Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Opportunities" subtitle="Why / what to act on" />
              <CardBody className="space-y-3">
                {opportunities.length === 0 && (
                  <p className="text-sm text-slate-500">No opportunity signals in this range.</p>
                )}
                {opportunities.map((o) => (
                  <div key={o.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{o.title}</h3>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] uppercase text-amber-800">
                        {o.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{o.why}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Demand intelligence" />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {demand.map((d) => (
                    <li key={d.productId} className="flex justify-between border-b border-slate-100 py-1">
                      <span>{d.name}</span>
                      <span>
                        {d.unitsSold} · {d.demandSignal}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {anomalies && anomalies.anomalies.length > 0 && (
            <Card>
              <CardHeader title="Revenue anomalies (|z| ≥ 2)" />
              <CardBody>
                <ul className="space-y-1 text-sm">
                  {anomalies.anomalies.map((a) => (
                    <li key={a.date}>
                      {a.date}: {formatNaira(a.revenueKobo)} (z={a.zScore.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          <HowToUse tells="Combines customer value, retention, demand, anomalies and causal drivers." watch="Treat CLV as a heuristic estimate and anomalies as investigative signals, not determinations." actions="Validate a signal in its source page before changing assortment, engagement, or risk policy." />
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
