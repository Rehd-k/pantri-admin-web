"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { VerificationEmployee } from "@/lib/types";

export default function VerificationQueuePage() {
  const [employees, setEmployees] = useState<VerificationEmployee[]>([]);
  const [salary, setSalary] = useState<Record<string, string>>({});
  const [multiplier, setMultiplier] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await api.get<VerificationEmployee[]>("/admin/verification/employees");
      setEmployees(rows);
      setSalary(Object.fromEntries(rows.map((row) => [row.id, String(row.salaryKobo || "")])));
      setMultiplier(Object.fromEntries(rows.map((row) => [row.id, String(row.creditMultiplierBps ?? 15000)])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load verification queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function approve(employeeId: string) {
    const salaryKobo = Number(salary[employeeId]);
    const creditMultiplierBps = Number(multiplier[employeeId]);
    if (!Number.isInteger(salaryKobo) || salaryKobo <= 0 || !Number.isInteger(creditMultiplierBps)) {
      setError("Enter a valid salary in kobo and credit multiplier in basis points.");
      return;
    }
    setBusyId(employeeId);
    setError(null);
    try {
      await api.post(`/admin/verification/employees/${employeeId}/approve`, { salaryKobo, creditMultiplierBps });
      setSuccess("Employee approved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approval failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(employeeId: string) {
    if (!reason[employeeId]?.trim()) {
      setError("Enter a rejection reason.");
      return;
    }
    setBusyId(employeeId);
    setError(null);
    try {
      await api.post(`/admin/verification/employees/${employeeId}/reject`, { reason: reason[employeeId] });
      setSuccess("Employee rejected.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rejection failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold text-slate-900">Verification</h1><p className="mt-1 text-sm text-slate-500">Review employment and payroll evidence before activating employee credit.</p></div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      {loading ? <Spinner label="Loading verification queue…" /> : employees.map((employee) => (
        <Card key={employee.id}>
          <CardHeader title={`${employee.firstName} ${employee.lastName}`} subtitle={`${employee.email} · submitted ${formatDateTime(employee.createdAt)}`} action={<Badge>{employee.verificationStatus}</Badge>} />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              {employee.documents.map((document) => <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-indigo-600">{document.type.replaceAll("_", " ")} · {document.status}</a>)}
              {!employee.documents.length ? <span className="text-sm text-slate-500">No documents attached.</span> : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Salary (kobo)"><Input type="number" min={1} value={salary[employee.id] ?? ""} onChange={(event) => setSalary((current) => ({ ...current, [employee.id]: event.target.value }))} /></Field>
              <Field label="Credit multiplier (bps)"><Input type="number" min={1000} max={100000} value={multiplier[employee.id] ?? ""} onChange={(event) => setMultiplier((current) => ({ ...current, [employee.id]: event.target.value }))} /></Field>
              <div className="flex items-end"><Button loading={busyId === employee.id} onClick={() => approve(employee.id)}>Approve</Button></div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Rejection reason" className="min-w-72 flex-1"><Input value={reason[employee.id] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [employee.id]: event.target.value }))} /></Field>
              <Button variant="danger" loading={busyId === employee.id} onClick={() => reject(employee.id)}>Reject</Button>
            </div>
          </CardBody>
        </Card>
      ))}
      {!loading && !employees.length ? <Card><CardBody><p className="text-sm text-slate-500">No employees are awaiting verification.</p></CardBody></Card> : null}
    </div>
  );
}
