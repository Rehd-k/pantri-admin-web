"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { DataTable, type Column } from "@/components/ui/Table";
import { API_BASE_URL, api, ApiError, getToken } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import type { AdminPayrollRunDetail } from "@/lib/types";

export default function PayrollRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<AdminPayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "confirm" | "remit" | "missed">(
    null,
  );

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<AdminPayrollRunDetail>(
        `/admin/payroll-runs/${runId}`,
      );
      setRun(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load run.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function runAction() {
    if (!confirm) return;
    setBusy(confirm);
    setError(null);
    setSuccess(null);
    try {
      if (confirm === "confirm") {
        const data = await api.patch<AdminPayrollRunDetail>(
          `/admin/payroll-runs/${runId}/confirm`,
        );
        setRun(data);
        setSuccess("Payroll run confirmed.");
      } else if (confirm === "remit") {
        const data = await api.post<AdminPayrollRunDetail>(
          `/admin/payroll-runs/${runId}/remit`,
        );
        setRun(data);
        setSuccess(
          `Remitted ${data.remittedCount ?? 0} lines` +
            (data.failedCount ? ` (${data.failedCount} failed)` : ""),
        );
      } else {
        const data = await api.patch<AdminPayrollRunDetail>(
          `/admin/payroll-runs/${runId}/mark-missed`,
        );
        setRun(data);
        setSuccess(`Marked ${data.missedCount ?? 0} lines as missed.`);
      }
      setConfirm(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadSignedInvoice() {
    setBusy("invoice");
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/admin/payroll-runs/${runId}/signed-invoice.pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!res.ok) {
        throw new Error(
          `Invoice download failed (${res.status}). Check that you are signed in as an admin.`,
        );
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      const filename =
        match?.[1] ?? `pantri-payroll-invoice-${runId}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      setSuccess("Signed payroll invoice downloaded.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download invoice.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading && !run) return <Spinner label="Loading payroll run…" />;
  if (!run) return error ? <ErrorBanner message={error} /> : null;

  const exceptionLines = run.lines.filter(
    (l) => l.status === "MISSED" || (l.status === "PENDING" && l.differenceKobo !== 0),
  );

  const columns: Column<AdminPayrollRunDetail["lines"][number]>[] = [
    {
      header: "Employee",
      accessor: (line) => (
        <div>
          <Link
            href={`/employees/${line.employeeId}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {line.employeeName}
          </Link>
          <p className="text-xs text-slate-400">{line.employeeEmail}</p>
        </div>
      ),
    },
    {
      header: "Expected",
      accessor: (line) => formatNaira(line.expectedKobo),
    },
    {
      header: "Actual",
      accessor: (line) => formatNaira(line.actualKobo),
    },
    {
      header: "Difference",
      accessor: (line) => (
        <span className={line.differenceKobo !== 0 ? "text-amber-800" : ""}>
          {formatNaira(line.differenceKobo)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (line) => <Badge>{line.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/payroll" className="text-sm text-indigo-600">
          ← Payroll runs
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {run.employerName}
          </h1>
          <Badge>{run.status}</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Payroll date {formatDate(run.payrollDate)} ·{" "}
          {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Expected</p>
            <p className="mt-1 text-xl font-semibold">
              {formatNaira(run.expectedKobo)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Received</p>
            <p className="mt-1 text-xl font-semibold">
              {formatNaira(run.receivedKobo)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Difference</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                run.differenceKobo > 0 ? "text-amber-800" : ""
              }`}
            >
              {formatNaira(run.differenceKobo)}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          loading={busy === "invoice"}
          onClick={() => void downloadSignedInvoice()}
        >
          Download signed invoice
        </Button>
        {["GENERATED", "EMPLOYER_REVIEW"].includes(run.status) ? (
          <Button onClick={() => setConfirm("confirm")}>Confirm run</Button>
        ) : null}
        {run.status === "CONFIRMED" ? (
          <Button onClick={() => setConfirm("remit")}>Remit deductions</Button>
        ) : null}
        {["CONFIRMED", "PROCESSING", "PARTIALLY_COMPLETED"].includes(run.status) ? (
          <Button variant="danger" onClick={() => setConfirm("missed")}>
            Mark pending as missed
          </Button>
        ) : null}
      </div>

      {exceptionLines.length > 0 ? (
        <Card>
          <CardHeader
            title="Exceptions requiring attention"
            subtitle={`${exceptionLines.length} line(s)`}
          />
          <CardBody>
            <DataTable
              columns={columns}
              rows={exceptionLines}
              keyFor={(line) => line.id}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="All deduction lines" />
        <CardBody>
          <DataTable
            columns={columns}
            rows={run.lines}
            keyFor={(line) => line.id}
            emptyMessage="No deduction lines on this run."
          />
        </CardBody>
      </Card>

      <Dialog
        open={confirm != null}
        title={
          confirm === "confirm"
            ? "Confirm this payroll run?"
            : confirm === "remit"
              ? "Remit all pending deductions?"
              : "Mark pending lines as missed?"
        }
        description={
          confirm === "confirm"
            ? "After confirmation you can remit collections against employee credit accounts."
            : confirm === "remit"
              ? `This posts PAYROLL_REPAYMENT ledger entries for pending lines totaling ${formatNaira(run.expectedKobo - run.receivedKobo)} still expected.`
              : "Pending lines will be marked MISSED and consecutive-miss counters will increase."
        }
        confirmVariant={confirm === "missed" ? "danger" : "primary"}
        loading={busy === confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runAction()}
      />
    </div>
  );
}
