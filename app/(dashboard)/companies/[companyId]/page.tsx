"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/Table";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import type { CompanyEmployee, CompanyInvoice, CompanyPortal } from "@/lib/types";

function monthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function CompanyPortalPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const defaults = monthBounds();
  const [company, setCompany] = useState<CompanyPortal | null>(null);
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [invoices, setInvoices] = useState<CompanyInvoice[]>([]);
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [companyData, employeeData, invoiceData] = await Promise.all([
        api.get<CompanyPortal>(`/admin/companies/${companyId}`),
        api.get<CompanyEmployee[]>(`/admin/companies/${companyId}/employees`),
        api.get<CompanyInvoice[]>(`/admin/companies/${companyId}/invoices`),
      ]);
      setCompany(companyData);
      setEmployees(employeeData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load company.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function generateInvoice() {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/admin/companies/${companyId}/invoices/generate`, {
        periodStart,
        periodEnd,
      });
      setSuccess("Invoice generated and issued.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate invoice.");
    } finally {
      setGenerating(false);
    }
  }

  const employeeColumns: Column<CompanyEmployee>[] = [
    {
      header: "Employee",
      accessor: (employee) => (
        <Link href={`/employees/${employee.id}`} className="font-medium text-indigo-600">
          {employee.firstName} {employee.lastName}
          <span className="block text-xs font-normal text-slate-400">{employee.email}</span>
        </Link>
      ),
    },
    { header: "Verification", accessor: (employee) => <Badge>{employee.verificationStatus}</Badge> },
    { header: "Salary", accessor: (employee) => formatNaira(employee.salaryKobo) },
    { header: "Exposure", accessor: (employee) => formatNaira(employee.exposureKobo) },
  ];

  const invoiceColumns: Column<CompanyInvoice>[] = [
    {
      header: "Period",
      accessor: (invoice) => `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
    },
    { header: "Status", accessor: (invoice) => <Badge>{invoice.status}</Badge> },
    { header: "Lines", accessor: (invoice) => invoice._count?.lines ?? "—" },
    { header: "Total due", accessor: (invoice) => formatNaira(invoice.totalDueKobo) },
    { header: "Remitted", accessor: (invoice) => formatNaira(invoice.remittedKobo) },
  ];

  if (loading && !company) return <Spinner label="Loading company portal…" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/companies" className="text-sm text-indigo-600">← Companies</Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{company?.name ?? "Company"}</h1>
        </div>
        <Link
          href={`/companies/${companyId}/pickup-points`}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700"
        >
          Pickup points
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {company ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Employees", String(company.employeeCount)],
            ["Verified", String(company.verifiedCount)],
            ["Pending verification", String(company.pendingVerificationCount)],
            ["Amount owed", formatNaira(company.amountOwedKobo)],
            ["Fulfilled purchases", formatNaira(company.totalPurchasesKobo)],
            ["Remitted", formatNaira(company.remittedKobo)],
          ].map(([label, value]) => (
            <Card key={label}><CardBody><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-900">{value}</p></CardBody></Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader title="Employees" />
        <CardBody className="p-0">
          <DataTable columns={employeeColumns} rows={employees} keyFor={(row) => row.id} emptyMessage="No employees found." />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Invoices" subtitle="Generate an issued invoice for a completed period." />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Period start"><Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></Field>
            <Field label="Period end"><Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></Field>
            <Button loading={generating} onClick={generateInvoice}>Generate invoice</Button>
          </div>
          <div className="-mx-5">
            <DataTable columns={invoiceColumns} rows={invoices} keyFor={(row) => row.id} emptyMessage="No invoices generated yet." />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent activity" />
        <CardBody>
          <div className="divide-y divide-slate-100">
            {company?.recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div><span className="font-medium text-slate-800">{activity.employeeName}</span><span className="ml-2 text-slate-500">{activity.type.toLowerCase()} · {activity.status}</span></div>
                <span className="text-xs text-slate-400">{formatDateTime(activity.occurredAt)}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
