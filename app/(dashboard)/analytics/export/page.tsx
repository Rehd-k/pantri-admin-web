"use client";

import { Suspense, useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

function Inner() {
  const q = useAnalyticsQuery();
  const [report, setReport] = useState("overview");
  const [format, setFormat] = useState("csv");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    try {
      const params = new URLSearchParams(q.replace(/^\?/, ""));
      params.set("report", report);
      params.set("format", format);
      const res = await fetch(
        `${API_BASE_URL}/admin/analytics/export?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getToken() ?? ""}`,
          },
        },
      );
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pantri-analytics-${report}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader title="Export analytics CSV" />
        <CardBody className="flex flex-wrap items-end gap-3">
          <Select value={report} onChange={(e) => setReport(e.target.value)}>
            <option value="overview">Overview</option>
            <option value="orders">Orders</option>
            <option value="products">Products</option>
            <option value="events">Events</option>
            <option value="search">Search</option>
          </Select>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="csv">CSV</option><option value="xlsx">Excel (.xlsx)</option><option value="pdf">PDF</option>
          </Select>
          <Button loading={busy} onClick={() => void download()}>
            Download {format.toUpperCase()}
          </Button>
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
