"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import type { AdminEmployeeDetail, OrderFulfillmentStatus } from "@/lib/types";

const NEXT_STATUS: Partial<Record<OrderFulfillmentStatus, OrderFulfillmentStatus>> = {
  APPROVED: "PROCESSING",
  PROCESSING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "FULFILLED",
};

export default function AdminEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<AdminEmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setEmployee(await api.get<AdminEmployeeDetail>(`/admin/employees/${employeeId}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  async function transition(orderId: string, status: OrderFulfillmentStatus) {
    setBusyId(orderId);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/employer/orders/${orderId}/transition`, { status });
      setSuccess(`Order moved to ${status.replaceAll("_", " ").toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transition failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !employee) return <Spinner label="Loading employee portal…" />;
  if (!employee) return error ? <ErrorBanner message={error} /> : null;

  const account = employee.creditAccount;
  const exposure = account
    ? account.principalOutstandingKobo + account.postedInterestKobo + account.postedFeesKobo + account.postedPenaltiesKobo
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/companies/${employee.employerId}`} className="text-sm text-indigo-600">← {employee.employer.name}</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{employee.user.firstName} {employee.user.lastName}</h1>
          <Badge>{employee.verificationStatus}</Badge>
        </div>
        <p className="text-sm text-slate-500">{employee.user.email} · {employee.phone ?? "No phone"}</p>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-xs text-slate-500">Salary</p><p className="mt-1 text-xl font-semibold">{formatNaira(employee.salaryKobo)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-slate-500">Credit limit</p><p className="mt-1 text-xl font-semibold">{formatNaira(account?.creditLimitKobo)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-slate-500">Exposure</p><p className="mt-1 text-xl font-semibold">{formatNaira(exposure)}</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Verification documents" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            {employee.verificationDocuments.map((document) => (
              <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-3 hover:border-indigo-300">
                <p className="font-medium text-slate-800">{document.type.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{document.fileName} · {document.status}</p>
              </a>
            ))}
            {!employee.verificationDocuments.length ? <p className="text-sm text-slate-500">No documents uploaded.</p> : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Orders and status history" />
        <CardBody className="flex flex-col gap-4">
          {employee.orders.map((order) => {
            const next = NEXT_STATUS[order.fulfillmentStatus];
            return (
              <div key={order.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-medium text-slate-900">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ") || order.id}</p><p className="text-xs text-slate-500">{formatDateTime(order.createdAt)} · {formatNaira(order.totalKobo)}</p></div>
                  <div className="flex items-center gap-2"><Badge>{order.fulfillmentStatus}</Badge>{next ? <Button className="px-2 py-1 text-xs" loading={busyId === order.id} onClick={() => transition(order.id, next)}>Move to {next.replaceAll("_", " ").toLowerCase()}</Button> : null}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.statusHistory.map((history) => <span key={history.id} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{history.toStatus} · {formatDateTime(history.createdAt)}</span>)}
                </div>
              </div>
            );
          })}
          {!employee.orders.length ? <p className="text-sm text-slate-500">No orders.</p> : null}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Credit ledger" subtitle="Latest 50 entries" />
          <CardBody className="divide-y divide-slate-100">
            {account?.ledgerEntries.map((entry) => <div key={entry.id} className="flex justify-between py-2 text-sm"><div><p>{entry.entryType.replaceAll("_", " ")}</p><p className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</p></div><div className="text-right"><p>{formatNaira(entry.amountKobo)}</p><p className="text-xs text-slate-400">Balance {formatNaira(entry.balanceAfterKobo)}</p></div></div>)}
            {!account?.ledgerEntries.length ? <p className="text-sm text-slate-500">No ledger entries.</p> : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Salary history" />
          <CardBody className="divide-y divide-slate-100">
            {employee.salaryHistory.map((salary) => <div key={salary.id} className="flex justify-between py-2 text-sm"><div><p>{salary.reason ?? "Salary update"}</p><p className="text-xs text-slate-400">{formatDate(salary.effectiveAt)}</p></div><p>{formatNaira(salary.salaryKobo)}</p></div>)}
            {!employee.salaryHistory.length ? <p className="text-sm text-slate-500">No salary history.</p> : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
