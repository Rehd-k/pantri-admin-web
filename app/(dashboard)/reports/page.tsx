"use client";

import { useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";

const PLANNED_METRICS = [
  "Total platform exposure (principal + interest + fees + penalties) across every employer",
  "Delinquency rate and consecutive-missed-deduction distribution",
  "Payroll remittance success rate by employer, by pay cycle",
  "Write-off velocity: requested vs. approved vs. rejected, by month",
  "Interest & fee revenue recognized, by month",
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/reports/exposure.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(
          "The global CSV export endpoint (GET /admin/reports/exposure.csv) isn't implemented on this backend yet.",
        );
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pantri-exposure-report.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cross-employer reporting for finance and risk teams. Per-employer breakdowns already
          exist at <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">GET /employers/me/reporting/balance-summary</code>{" "}
          and <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/exposure</code>; this page
          is the staging ground for the platform-wide rollup.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader
          title="Global exposure export"
          subtitle="Aggregates every employer's credit exposure into a single CSV"
        />
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Planned metrics for this rollup:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-600">
            {PLANNED_METRICS.map((metric) => (
              <li key={metric}>{metric}</li>
            ))}
          </ul>
          <div>
            <Button onClick={handleDownload} loading={downloading} variant="secondary">
              Download CSV
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Available today" subtitle="Real per-employer data you can already pull" />
        <CardBody className="text-sm text-slate-600">
          <p>
            Until the platform-wide rollup ships, run per-employer reporting from the{" "}
            <span className="font-medium text-slate-800">employer-web</span> dashboard (
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/</code>), or call the
            reporting endpoints directly for each employer:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
{`GET /api/v1/employers/me/reporting/balance-summary
GET /api/v1/employers/me/reporting/exposure`}
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}
