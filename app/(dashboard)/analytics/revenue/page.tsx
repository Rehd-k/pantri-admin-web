"use client";

import { Suspense, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { AnalyticsNav, useAnalyticsQuery } from "@/components/analytics/AnalyticsNav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { DrillLink } from "@/components/analytics/DrillLink";

type RevenueRow = { month?: string; employerId?: string; name?: string; revenueKobo: number; firstPurchaseKobo: number; repeatPurchaseKobo: number; orders: number };

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{ byMonth: RevenueRow[]; byEmployer: RevenueRow[]; firstVsRepeat: { firstPurchaseKobo: number; repeatPurchaseKobo: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void api.get<NonNullable<typeof data>>(`/admin/analytics/revenue${q}`).then(setData).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load revenue")); }, [q]);
  return <AnalyticsNav>{error && <ErrorBanner message={error} />}{data && <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><StatCard label="First-purchase revenue" value={formatNaira(data.firstVsRepeat.firstPurchaseKobo)} /><StatCard label="Repeat-purchase revenue" value={formatNaira(data.firstVsRepeat.repeatPurchaseKobo)} /></div>
    <Card><CardHeader title="Revenue mix over time" /><CardBody><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.byMonth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis hide /><Tooltip formatter={(value) => formatNaira(Number(value))} /><Legend /><Bar dataKey="firstPurchaseKobo" name="First purchase" stackId="revenue" fill="#94a3b8" /><Bar dataKey="repeatPurchaseKobo" name="Repeat purchase" stackId="revenue" fill="#047857" /></BarChart></ResponsiveContainer></div></CardBody></Card>
    <Card><CardHeader title="Revenue by employer" /><CardBody><DataTable columns={[{ header: "Employer", accessor: (row: RevenueRow) => row.employerId ? <DrillLink type="employer" id={row.employerId}>{row.name}</DrillLink> : row.name }, { header: "Revenue", accessor: (row: RevenueRow) => formatNaira(row.revenueKobo) }, { header: "Orders", accessor: (row: RevenueRow) => row.orders }, { header: "Repeat", accessor: (row: RevenueRow) => formatNaira(row.repeatPurchaseKobo) }]} rows={data.byEmployer} keyFor={(row) => row.employerId ?? row.name ?? ""} /></CardBody></Card>
  </div>}</AnalyticsNav>;
}

export default function Page() { return <Suspense fallback={<Spinner label="Loading revenue…" />}><Inner /></Suspense>; }
