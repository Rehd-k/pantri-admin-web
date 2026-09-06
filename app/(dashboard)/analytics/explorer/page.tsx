"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

type EventRow = {
  id: string;
  eventName: string;
  occurredAt: string;
  userId: string | null;
  employeeId: string | null;
  employerId: string | null;
  platform: string | null;
  entityType: string | null;
  entityId: string | null;
};

function Inner() {
  const q = useAnalyticsQuery();
  const [mode, setMode] = useState<"events" | "metrics">("events");
  const [metric, setMetric] = useState("revenue");
  const [breakdown, setBreakdown] = useState("month");
  const [metricRows, setMetricRows] = useState<Array<{ key: string; label?: string; value: number }>>([]);
  const [eventName, setEventName] = useState("");
  const [rows, setRows] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(name = eventName) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(q.replace(/^\?/, ""));
      if (name.trim()) params.set("eventName", name.trim());
      params.set("limit", "100");
      if (mode === "metrics") {
        params.delete("eventName");
        params.set("metric", metric);
        params.set("breakdown", breakdown);
      }
      const data = await api.get<{
        events?: EventRow[];
        rows?: typeof metricRows;
        total?: number;
        behavioralNotice: string;
      }>(`/admin/analytics/explorer?${params.toString()}`);
      setRows(data.events ?? []);
      setMetricRows(data.rows ?? []);
      setTotal(data.total ?? data.rows?.length ?? 0);
      setNotice(data.behavioralNotice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const columns: Column<EventRow>[] = [
    { id: "time", header: "Time", accessor: (r) => new Date(r.occurredAt).toLocaleString() },
    { id: "name", header: "Event", accessor: (r) => r.eventName },
    { id: "platform", header: "Platform", accessor: (r) => r.platform ?? "—" },
    { id: "employee", header: "Employee", accessor: (r) => r.employeeId?.slice(0, 8) ?? "—" },
    { id: "entity", header: "Entity", accessor: (r) => (r.entityType ? `${r.entityType}:${r.entityId?.slice(0, 8)}` : "—") },
  ];

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <p className="mb-3 text-sm text-amber-900">{notice}</p>
      <Card>
        <CardHeader
          title="Analytics explorer"
          subtitle={`${total} matching ${mode === "events" ? "events" : "groups"}`}
          action={<SourceBadge source="behavioral" />}
        />
        <CardBody className="space-y-4">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">{(["events", "metrics"] as const).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-sm capitalize ${mode === item ? "bg-white font-medium text-emerald-700 shadow-sm" : "text-slate-500"}`}>{item}</button>)}</div>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            {mode === "events" ? <Field label="Event name">
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="employee.product_viewed"
              />
            </Field> : <><Field label="Metric"><select className="rounded-lg border border-slate-300 px-3 py-2" value={metric} onChange={(e) => setMetric(e.target.value)}><option value="revenue">Revenue</option><option value="orders">Orders</option><option value="aov">AOV</option><option value="active_users">Active users</option></select></Field><Field label="Breakdown"><select className="rounded-lg border border-slate-300 px-3 py-2" value={breakdown} onChange={(e) => setBreakdown(e.target.value)}><option value="month">Month</option><option value="employer">Employer</option><option value="category">Category</option></select></Field></>}
            <Button type="submit">Filter</Button>
          </form>
          {loading ? (
            <Spinner label="Loading events…" />
          ) : (
            mode === "events" ? <DataTable columns={columns} rows={rows} keyFor={(r) => r.id} /> : <DataTable columns={[{ header: breakdown, accessor: (r: typeof metricRows[number]) => r.label ?? r.key }, { header: metric, accessor: (r: typeof metricRows[number]) => r.value.toLocaleString() }]} rows={metricRows} keyFor={(r) => r.key} />
          )}
        </CardBody>
      </Card>
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
