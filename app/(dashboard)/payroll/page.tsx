"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/Table";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/format";
import type { AdminPayrollRunListItem, CompanyListItem } from "@/lib/types";

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<AdminPayrollRunListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [employerId, setEmployerId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (employerId) params.set("employerId", employerId);
      if (status) params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      const [runData, companyData] = await Promise.all([
        api.get<AdminPayrollRunListItem[]>(
          `/admin/payroll-runs${qs ? `?${qs}` : ""}`,
        ),
        companies.length
          ? Promise.resolve(companies)
          : api.get<CompanyListItem[]>("/admin/companies"),
      ]);
      setRuns(runData);
      if (!companies.length) setCompanies(companyData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load payroll runs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = runs.reduce(
    (acc, run) => {
      acc.expected += run.expectedKobo;
      acc.received += run.receivedKobo;
      acc.missed += run.missedCount;
      return acc;
    },
    { expected: 0, received: 0, missed: 0 },
  );

  const columns: Column<AdminPayrollRunListItem>[] = [
    {
      header: "Employer",
      accessor: (run) => (
        <div>
          <Link
            href={`/payroll/${run.id}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {run.employerName}
          </Link>
          <p className="text-xs text-slate-400">{formatDate(run.payrollDate)}</p>
        </div>
      ),
    },
    {
      header: "Period",
      accessor: (run) =>
        `${formatDate(run.periodStart)} – ${formatDate(run.periodEnd)}`,
    },
    {
      header: "Expected",
      accessor: (run) => formatNaira(run.expectedKobo),
    },
    {
      header: "Received",
      accessor: (run) => formatNaira(run.receivedKobo),
    },
    {
      header: "Difference",
      accessor: (run) => (
        <span className={run.differenceKobo > 0 ? "text-amber-700" : ""}>
          {formatNaira(run.differenceKobo)}
        </span>
      ),
    },
    {
      header: "Exceptions",
      accessor: (run) =>
        run.missedCount > 0 || run.pendingCount > 0 ? (
          <span className="text-sm text-amber-800">
            {run.missedCount} missed · {run.pendingCount} pending
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
    {
      header: "Status",
      accessor: (run) => <Badge>{run.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Payroll</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reconcile expected payroll deductions against what Pantri received.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Expected (filtered)</p>
            <p className="mt-1 text-xl font-semibold">{formatNaira(totals.expected)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Received (filtered)</p>
            <p className="mt-1 text-xl font-semibold">{formatNaira(totals.received)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Missed line count</p>
            <p className="mt-1 text-xl font-semibold text-amber-800">{totals.missed}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-5">
            <Field label="Employer">
              <Select
                value={employerId}
                onChange={(e) => setEmployerId(e.target.value)}
              >
                <option value="">All employers</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {[
                  "GENERATED",
                  "EMPLOYER_REVIEW",
                  "CONFIRMED",
                  "PROCESSING",
                  "COMPLETED",
                  "PARTIALLY_COMPLETED",
                  "FAILED",
                  "CANCELLED",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Spinner label="Loading payroll runs…" />
      ) : (
        <DataTable
          columns={columns}
          rows={runs}
          keyFor={(run) => run.id}
          emptyMessage="No payroll runs found."
        />
      )}
    </div>
  );
}
