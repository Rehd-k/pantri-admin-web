"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { AnalyticsNav, useAnalyticsQuery } from "@/components/analytics/AnalyticsNav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

type Mover = { key: string; label: string; current: number; previous: number; delta: number };
type Why = { summary: Record<string, { current: number; previous: number; delta: number }>; byEmployer: Mover[]; byCategory: Mover[]; byProduct: Mover[] };

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<Why | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void api.get<Why>(`/admin/analytics/why${q}`).then(setData).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to explain change")); }, [q]);
  const columns = [{ header: "Driver", accessor: (row: Mover) => row.label }, { header: "Current", accessor: (row: Mover) => formatNaira(row.current) }, { header: "Previous", accessor: (row: Mover) => formatNaira(row.previous) }, { header: "Change", accessor: (row: Mover) => <span className={row.delta >= 0 ? "text-emerald-700" : "text-rose-700"}>{formatNaira(row.delta)}</span> }];
  return <AnalyticsNav>{error && <ErrorBanner message={error} />}{data && <div className="space-y-4"><div><h2 className="text-xl font-semibold text-slate-900">Why did revenue change?</h2><p className="mt-1 text-sm text-slate-500">Largest employer, category and product contributions versus the previous equivalent period.</p></div>{([["Employers", data.byEmployer], ["Categories", data.byCategory], ["Products", data.byProduct]] as const).map(([title, rows]) => <Card key={title}><CardHeader title={title} /><CardBody><DataTable columns={columns} rows={rows} keyFor={(row) => row.key} /></CardBody></Card>)}</div>}</AnalyticsNav>;
}

export default function Page() { return <Suspense fallback={<Spinner label="Analyzing drivers…" />}><Inner /></Suspense>; }
