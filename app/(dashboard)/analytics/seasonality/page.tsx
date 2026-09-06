"use client";

import { Suspense, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { formatNaira } from "@/lib/format";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{
    byDayOfWeek: Array<{ dayOfWeek: number; orderCount: number; revenueKobo: number }>;
    byMonth: Array<{ month: string; orderCount: number; revenueKobo: number }>;
    byHour?: Array<{ hour: number; orderCount: number; revenueKobo: number }>;
    paydayRelative?: Array<{ bucket: string; orderCount: number; revenueKobo: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await api.get(`/admin/analytics/seasonality${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  const dow = (data?.byDayOfWeek ?? []).map((d) => ({
    ...d,
    label: DOW[d.dayOfWeek] ?? String(d.dayOfWeek),
  }));

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader title="Orders by day of week" action={<SourceBadge source="business" />} />
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orderCount" fill="#047857" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <Card className="mt-4">
        <CardHeader title="Orders by month" action={<SourceBadge source="business" />} />
        <CardBody>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orderCount" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Orders by hour (UTC)" /><CardBody><div className="grid grid-cols-6 gap-1">{(data?.byHour ?? []).map((row) => <div key={row.hour} className="rounded p-2 text-center text-xs" style={{ backgroundColor: `rgba(4,120,87,${0.08 + Math.min(0.82, row.orderCount / Math.max(...(data?.byHour ?? []).map((item) => item.orderCount), 1))})` }}><span className="font-medium">{String(row.hour).padStart(2, "0")}:00</span><br />{row.orderCount}</div>)}</div></CardBody></Card>
        <Card><CardHeader title="Payday-relative demand" /><CardBody><ul className="divide-y divide-slate-100">{(data?.paydayRelative ?? []).map((row) => <li key={row.bucket} className="flex justify-between gap-3 py-2 text-sm"><span className="capitalize text-slate-600">{row.bucket.replaceAll("_", " ")}</span><span className="font-medium">{row.orderCount} · {formatNaira(row.revenueKobo)}</span></li>)}</ul>{!(data?.paydayRelative ?? []).length && <p className="text-sm text-slate-500">No payday-relative activity.</p>}</CardBody></Card>
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
