"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { AnalyticsNav, useAnalyticsQuery } from "@/components/analytics/AnalyticsNav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { DrillLink } from "@/components/analytics/DrillLink";

type Segment = { segmentKey: string; count: number; sampleMembers: Array<{ employeeId: string; scores: unknown }> };

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{ asOfDate: string | null; segments: Segment[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void api.get<{ asOfDate: string | null; segments: Segment[] }>(`/admin/analytics/segments${q}`).then(setData).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load segments")); }, [q]);
  return <AnalyticsNav>{error && <ErrorBanner message={error} />}<Card><CardHeader title="Customer segments" subtitle={data?.asOfDate ? `Snapshot ${data.asOfDate}` : "Latest segmentation snapshot"} /><CardBody><DataTable columns={[
    { header: "Segment", accessor: (row: Segment) => <span className="font-medium capitalize">{row.segmentKey.replaceAll("_", " ")}</span> },
    { header: "Customers", accessor: (row: Segment) => row.count.toLocaleString() },
    { header: "Sample members", accessor: (row: Segment) => <div className="flex flex-wrap gap-2">{row.sampleMembers.map((member) => <DrillLink key={member.employeeId} type="employee" id={member.employeeId} />)}</div> },
  ]} rows={data?.segments ?? []} keyFor={(row) => row.segmentKey} emptyMessage="No segment snapshot is available." /></CardBody></Card></AnalyticsNav>;
}

export default function Page() { return <Suspense fallback={<Spinner label="Loading segments…" />}><Inner /></Suspense>; }
