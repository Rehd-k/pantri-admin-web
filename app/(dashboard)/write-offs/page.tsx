"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { WriteOffRequest, WriteOffStatus } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDateTime, formatNaira } from "@/lib/format";

const STATUS_FILTERS: { label: string; value: WriteOffStatus | "" }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "All", value: "" },
  { label: "Executed", value: "EXECUTED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function WriteOffsPage() {
  const [requests, setRequests] = useState<WriteOffRequest[]>([]);
  const [status, setStatus] = useState<WriteOffStatus | "">("PENDING");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ creditAccountId: "", amountKobo: "", reason: "" });

  async function loadRequests(currentStatus: WriteOffStatus | "") {
    setLoading(true);
    setError(null);
    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const data = await api.get<WriteOffRequest[]>(`/admin/write-offs${query}`);
      setRequests(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load write-off requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/admin/write-offs", {
        creditAccountId: form.creditAccountId.trim(),
        amountKobo: Math.round(Number(form.amountKobo) * 100),
        reason: form.reason.trim(),
      });
      setSuccess("Write-off request submitted.");
      setForm({ creditAccountId: "", amountKobo: "", reason: "" });
      await loadRequests(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit write-off request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/admin/write-offs/${id}/${decision}`);
      setSuccess(`Write-off ${decision === "approve" ? "approved and posted to the ledger" : "rejected"}.`);
      await loadRequests(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<WriteOffRequest>[] = [
    {
      header: "Employee",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.employeeName ?? row.creditAccountId}</p>
          <p className="text-xs text-slate-400">{row.employerName ?? "—"}</p>
        </div>
      ),
    },
    { header: "Amount", accessor: (row) => formatNaira(row.amountKobo) },
    { header: "Reason", accessor: (row) => <span className="max-w-xs truncate">{row.reason}</span> },
    { header: "Status", accessor: (row) => <Badge>{row.status}</Badge> },
    { header: "Requested by", accessor: (row) => row.requestedByName ?? "—" },
    { header: "Requested", accessor: (row) => formatDateTime(row.createdAt) },
    {
      header: "Actions",
      accessor: (row) =>
        row.status === "PENDING" ? (
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="px-2 py-1 text-xs"
              loading={busyId === row.id}
              onClick={() => handleDecision(row.id, "approve")}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              className="px-2 py-1 text-xs"
              loading={busyId === row.id}
              onClick={() => handleDecision(row.id, "reject")}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            {row.approvedByName ? `by ${row.approvedByName}` : "—"}
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Write-Offs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Request a write-off against an uncollectable balance, then have a{" "}
          <strong>different</strong> admin approve it — dual approval is enforced server-side, so
          the requester cannot also approve their own request. Approval immediately posts a{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">WRITE_OFF</code> ledger entry,
          allocated across interest, fees, penalties, then principal.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <Card>
        <CardHeader title="Request a write-off" subtitle="Requires the target credit account ID" />
        <CardBody>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Field label="Credit account ID" className="sm:col-span-2">
              <Input
                required
                placeholder="cku1a2b3c4d5..."
                value={form.creditAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, creditAccountId: e.target.value }))}
              />
            </Field>
            <Field label="Amount (₦)">
              <Input
                type="number"
                required
                min={0.01}
                step="0.01"
                value={form.amountKobo}
                onChange={(e) => setForm((prev) => ({ ...prev, amountKobo: e.target.value }))}
              />
            </Field>
            <Field label="Reason" className="sm:col-span-4">
              <Textarea
                required
                rows={2}
                placeholder="e.g. Employee terminated with no further payroll recourse"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </Field>
            <div className="sm:col-span-4">
              <Button type="submit" loading={submitting}>
                Submit request
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Write-off requests"
          action={
            <Select value={status} onChange={(e) => setStatus(e.target.value as WriteOffStatus | "")}>
              {STATUS_FILTERS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          }
        />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading write-off requests…" />
          ) : (
            <DataTable
              columns={columns}
              rows={requests}
              keyFor={(row) => row.id}
              emptyMessage="No write-off requests match this filter."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
