"use client";

import Link from "next/link";
import { useState } from "react";
import { API_BASE_URL, getToken } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/admin/reports/exposure.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(
          `Export failed (${res.status}). Check that you are signed in as an admin.`,
        );
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pantri-exposure-report.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      setSuccess("Exposure CSV downloaded.");
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
          Cross-employer financial exports and operational rollups.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <Card>
        <CardHeader
          title="Global exposure export"
          subtitle="CSV of outstanding credit by employer"
        />
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Downloads employerId, company name, employee count, and total exposure
            in kobo across the platform.
          </p>
          <div>
            <Button onClick={() => void handleDownload()} loading={downloading}>
              Download exposure CSV
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Related operational views" />
        <CardBody className="flex flex-col gap-3 text-sm">
          <Link href="/payroll" className="text-indigo-700 hover:underline">
            Payroll reconciliation — expected vs received deductions
          </Link>
          <Link href="/" className="text-indigo-700 hover:underline">
            Overview — outstanding credit and attention queue
          </Link>
          <Link href="/companies" className="text-indigo-700 hover:underline">
            Companies — per-employer remittance invoices
          </Link>
          <Link href="/write-offs" className="text-indigo-700 hover:underline">
            Write-offs — uncollectable balance workflow
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
