"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { api, ApiError } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatNaira,
  koboToNairaInput,
  nairaToKobo,
} from "@/lib/format";
import type {
  AdminEmployeeDetail,
  AdminLedgerEntry,
  OrderFulfillmentStatus,
} from "@/lib/types";

const NEXT_STATUS: Partial<Record<OrderFulfillmentStatus, OrderFulfillmentStatus>> = {
  APPROVED: "PROCESSING",
  PROCESSING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "FULFILLED",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "credit", label: "Credit" },
  { id: "activity", label: "Activity" },
  { id: "ledger", label: "Ledger" },
  { id: "payroll", label: "Payroll" },
];

function ledgerReason(entry: AdminLedgerEntry): string {
  const reason = entry.metadata?.reason;
  return typeof reason === "string" ? reason : "—";
}

export default function AdminEmployeePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<AdminEmployeeDetail | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [salaryNaira, setSalaryNaira] = useState("");
  const [multiplierBps, setMultiplierBps] = useState("15000");
  const [salaryReason, setSalaryReason] = useState("");
  const [adjustNaira, setAdjustNaira] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [limitNaira, setLimitNaira] = useState("");
  const [limitReason, setLimitReason] = useState("");
  const [confirm, setConfirm] = useState<
    | null
    | {
        kind: "adjust" | "limit" | "clear-limit" | "freeze" | "unfreeze";
        title: string;
        description: string;
      }
  >(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<AdminEmployeeDetail>(`/admin/employees/${employeeId}`);
      setEmployee(data);
      setSalaryNaira(koboToNairaInput(data.salaryKobo));
      setMultiplierBps(String(data.creditMultiplierBps ?? 15000));
      const override = data.creditAccount?.manualLimitOverrideKobo;
      setLimitNaira(
        override != null ? koboToNairaInput(override) : koboToNairaInput(data.creditAccount?.creditLimitKobo ?? 0),
      );
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

  const finance = employee?.finance;
  const account = employee?.creditAccount;
  const isFrozen = (finance?.accountStatus ?? account?.status) === "FROZEN";

  const purchaseEntries = useMemo(
    () =>
      (account?.ledgerEntries ?? []).filter((e) =>
        ["PURCHASE_POSTED", "DELIVERY_FEE", "SERVICE_FEE"].includes(e.entryType),
      ),
    [account?.ledgerEntries],
  );
  const repaymentEntries = useMemo(
    () =>
      (account?.ledgerEntries ?? []).filter((e) =>
        ["PAYROLL_REPAYMENT", "REFUND", "WRITE_OFF"].includes(e.entryType),
      ),
    [account?.ledgerEntries],
  );

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

  async function updateSalary() {
    const salaryKobo = nairaToKobo(salaryNaira);
    const creditMultiplierBps = Number(multiplierBps);
    if (salaryKobo === null || salaryKobo < 1 || !Number.isInteger(creditMultiplierBps)) {
      setError("Enter a valid salary in naira and credit multiplier in basis points.");
      return;
    }
    setBusyId("salary");
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<AdminEmployeeDetail>(
        `/admin/employees/${employeeId}/salary`,
        {
          salaryKobo,
          creditMultiplierBps,
          ...(salaryReason.trim() ? { reason: salaryReason.trim() } : {}),
        },
      );
      setEmployee(updated);
      setSalaryNaira(koboToNairaInput(updated.salaryKobo));
      setMultiplierBps(String(updated.creditMultiplierBps ?? 15000));
      setSalaryReason("");
      setSuccess("Salary updated. Credit limit recalculated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Salary update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function runConfirmedAction() {
    if (!confirm) return;
    setBusyId(confirm.kind);
    setError(null);
    setSuccess(null);
    try {
      if (confirm.kind === "adjust") {
        const amountKobo = nairaToKobo(adjustNaira);
        if (amountKobo === null || amountKobo === 0 || !adjustReason.trim()) {
          throw new Error("Enter a non-zero amount and a reason.");
        }
        const result = await api.post<{
          balanceAfterKobo: number;
          outstandingKobo: number;
        }>(`/admin/credit/employees/${employeeId}/adjustments`, {
          amountKobo,
          reason: adjustReason.trim(),
        });
        setSuccess(
          `Adjustment posted. Outstanding now ${formatNaira(result.outstandingKobo)}.`,
        );
        setAdjustNaira("");
        setAdjustReason("");
      } else if (confirm.kind === "limit") {
        const manualLimitOverrideKobo = nairaToKobo(limitNaira);
        if (manualLimitOverrideKobo === null || !limitReason.trim()) {
          throw new Error("Enter a valid limit and reason.");
        }
        await api.patch(`/admin/credit/employees/${employeeId}/limit`, {
          manualLimitOverrideKobo,
          reason: limitReason.trim(),
        });
        setSuccess("Credit limit override saved.");
        setLimitReason("");
      } else if (confirm.kind === "clear-limit") {
        if (!limitReason.trim()) throw new Error("Reason is required to clear override.");
        await api.patch(`/admin/credit/employees/${employeeId}/limit`, {
          manualLimitOverrideKobo: null,
          reason: limitReason.trim(),
        });
        setSuccess("Manual limit cleared. Salary-based limit restored.");
        setLimitReason("");
      } else if (confirm.kind === "freeze") {
        await api.patch(`/admin/credit/employees/${employeeId}/freeze`);
        setSuccess("Credit account placed on hold.");
      } else if (confirm.kind === "unfreeze") {
        await api.patch(`/admin/credit/employees/${employeeId}/unfreeze`);
        setSuccess("Credit account released from hold.");
      }
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !employee) return <Spinner label="Loading employee portal…" />;
  if (!employee) return error ? <ErrorBanner message={error} /> : null;

  const monthlyDeduction =
    finance?.monthlyDeductionKobo ??
    employee.monthlyDeductionKobo ??
    Math.floor((employee.salaryKobo * employee.deductionPercent) / 100);
  const outstanding =
    finance?.outstandingKobo ??
    (account
      ? account.principalOutstandingKobo +
        account.postedInterestKobo +
        account.postedFeesKobo +
        account.postedPenaltiesKobo
      : 0);
  const available = finance?.availableKobo ?? account?.availableKobo ?? 0;
  const utilization = finance?.utilizationPercent ?? 0;
  const effectiveLimit =
    finance?.effectiveCreditLimitKobo ?? account?.creditLimitKobo ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/companies/${employee.employerId}`} className="text-sm text-indigo-600">
          ← {employee.employer.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {employee.user.firstName} {employee.user.lastName}
          </h1>
          <Badge>{employee.verificationStatus}</Badge>
          {employee.accountStatus ? <Badge>{employee.accountStatus}</Badge> : null}
          {isFrozen ? <Badge tone="danger">FROZEN</Badge> : null}
        </div>
        <p className="text-sm text-slate-500">
          {employee.user.email} · {employee.phone ?? "No phone"}
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatNaira(outstanding)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Monthly deduction (20% of salary)</p>
            <p className="mt-1 text-xl font-semibold">{formatNaira(monthlyDeduction)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {employee.deductionPercent}% of {formatNaira(employee.salaryKobo)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Available credit</p>
            <p className="mt-1 text-xl font-semibold">{formatNaira(available)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Estimated payoff</p>
            <p className="mt-1 text-xl font-semibold">
              {finance?.estimatedPayoffMonths != null
                ? `${finance.estimatedPayoffMonths} mo`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {finance?.estimatedPayoffDate
                ? `~${formatDate(finance.estimatedPayoffDate)}`
                : outstanding === 0
                  ? "Nothing owed"
                  : "Unable to estimate"}
            </p>
          </CardBody>
        </Card>
      </div>

      <ProgressBar value={utilization} label="Credit utilization" />

      <Tabs tabs={TABS} activeId={tab} onChange={setTab} />

      <TabPanel when="overview" activeId={tab}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Employee" />
            <CardBody className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Employer:</span> {employee.employer.name}
              </p>
              <p>
                <span className="text-slate-500">Salary:</span> {formatNaira(employee.salaryKobo)}
              </p>
              <p>
                <span className="text-slate-500">Employment / account:</span>{" "}
                {employee.accountStatus ?? employee.user.status}
              </p>
              <p>
                <span className="text-slate-500">Last purchase:</span>{" "}
                {finance?.lastPurchaseAt ? formatDateTime(finance.lastPurchaseAt) : "—"}
              </p>
              <p>
                <span className="text-slate-500">Last repayment:</span>{" "}
                {finance?.lastRepaymentAt ? formatDateTime(finance.lastRepaymentAt) : "—"}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Update salary"
              subtitle="Recalculates the salary-based credit limit; monthly deduction stays at deduction %"
            />
            <CardBody>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Monthly salary (₦)">
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    value={salaryNaira}
                    onChange={(e) => setSalaryNaira(e.target.value)}
                  />
                </Field>
                <Field label="Credit multiplier (bps)">
                  <Input
                    type="number"
                    min={1000}
                    max={100000}
                    value={multiplierBps}
                    onChange={(e) => setMultiplierBps(e.target.value)}
                  />
                </Field>
                <Field label="Reason (optional)">
                  <Input
                    value={salaryReason}
                    onChange={(e) => setSalaryReason(e.target.value)}
                    placeholder="e.g. Annual raise"
                  />
                </Field>
                <div className="flex items-end">
                  <Button loading={busyId === "salary"} onClick={() => void updateSalary()}>
                    Save salary
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <TabPanel when="credit" activeId={tab}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Credit account" />
            <CardBody className="space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Computed limit:</span>{" "}
                {formatNaira(account?.creditLimitKobo)}
              </p>
              <p>
                <span className="text-slate-500">Manual override:</span>{" "}
                {account?.manualLimitOverrideKobo != null
                  ? formatNaira(account.manualLimitOverrideKobo)
                  : "None"}
              </p>
              <p>
                <span className="text-slate-500">Effective limit:</span>{" "}
                {formatNaira(effectiveLimit)}
              </p>
              <p>
                <span className="text-slate-500">Reserved:</span>{" "}
                {formatNaira(finance?.reservedKobo ?? account?.reservedKobo)}
              </p>
              <p>
                <span className="text-slate-500">Status:</span>{" "}
                {finance?.accountStatus ?? account?.status ?? "—"}
              </p>
              <div className="flex flex-wrap gap-2 pt-3">
                {isFrozen ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirm({
                        kind: "unfreeze",
                        title: "Release account from hold?",
                        description:
                          "The employee will be able to make new purchases subject to available credit.",
                      })
                    }
                  >
                    Release hold
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setConfirm({
                        kind: "freeze",
                        title: "Place account on hold?",
                        description:
                          "New purchases will be blocked until the account is released. Existing outstanding balance still requires repayment.",
                      })
                    }
                  >
                    Place on hold
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Set credit limit override"
              subtitle="Does not change the 20% monthly deduction"
            />
            <CardBody className="space-y-3">
              <Field label="Limit (₦)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={limitNaira}
                  onChange={(e) => setLimitNaira(e.target.value)}
                />
              </Field>
              <Field label="Reason">
                <Input
                  value={limitReason}
                  onChange={(e) => setLimitReason(e.target.value)}
                  placeholder="Required for audit trail"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    setConfirm({
                      kind: "limit",
                      title: "Update credit limit?",
                      description: `Set manual override to ₦${limitNaira || "0"}. This is recorded in the ledger and audit log.`,
                    })
                  }
                >
                  Save limit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setConfirm({
                      kind: "clear-limit",
                      title: "Clear manual override?",
                      description:
                        "Restores the salary × multiplier computed limit. Requires a reason.",
                    })
                  }
                >
                  Clear override
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Credit adjustment"
              subtitle="Positive increases amount owed; negative reduces it. Never silently overwrites the balance."
            />
            <CardBody className="grid gap-3 md:grid-cols-3">
              <Field label="Amount (₦, signed)">
                <Input
                  type="number"
                  step="0.01"
                  value={adjustNaira}
                  onChange={(e) => setAdjustNaira(e.target.value)}
                  placeholder="e.g. 10000 or -5000"
                />
              </Field>
              <Field label="Reason">
                <Input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Required"
                />
              </Field>
              <div className="flex items-end">
                <Button
                  variant="danger"
                  onClick={() =>
                    setConfirm({
                      kind: "adjust",
                      title: "Post credit adjustment?",
                      description: `This will change outstanding by ₦${adjustNaira || "0"} and create an immutable ledger entry.`,
                    })
                  }
                >
                  Post adjustment
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <TabPanel when="activity" activeId={tab}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Recent purchases" />
            <CardBody className="divide-y divide-slate-100">
              {purchaseEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex justify-between py-2 text-sm">
                  <div>
                    <p>{entry.entryType.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <p className="font-medium">{formatNaira(entry.amountKobo)}</p>
                </div>
              ))}
              {!purchaseEntries.length ? (
                <p className="text-sm text-slate-500">No purchases yet.</p>
              ) : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recent repayments" />
            <CardBody className="divide-y divide-slate-100">
              {repaymentEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex justify-between py-2 text-sm">
                  <div>
                    <p>{entry.entryType.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <p className="font-medium">{formatNaira(entry.amountKobo)}</p>
                </div>
              ))}
              {!repaymentEntries.length ? (
                <p className="text-sm text-slate-500">No repayments yet.</p>
              ) : null}
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Orders" subtitle="Fulfillment and credit impact" />
            <CardBody className="flex flex-col gap-4">
              {employee.orders.map((order) => {
                const next = NEXT_STATUS[order.fulfillmentStatus];
                return (
                  <div key={order.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.items
                            .map((item) => `${item.quantity}× ${item.name}`)
                            .join(", ") || order.id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                        <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                          <p>Order total: {formatNaira(order.totalKobo)}</p>
                          <p>Fulfilled: {formatNaira(order.fulfilledKobo ?? 0)}</p>
                          <p>
                            Reserved:{" "}
                            {order.reservedKobo != null
                              ? formatNaira(order.reservedKobo)
                              : "—"}
                          </p>
                          <p>Credit: {order.creditStatus.replaceAll("_", " ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{order.fulfillmentStatus}</Badge>
                        <Badge tone="info">{order.creditStatus}</Badge>
                        {next ? (
                          <Button
                            className="px-2 py-1 text-xs"
                            loading={busyId === order.id}
                            onClick={() => transition(order.id, next)}
                          >
                            Move to {next.replaceAll("_", " ").toLowerCase()}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!employee.orders.length ? (
                <p className="text-sm text-slate-500">No orders.</p>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </TabPanel>

      <TabPanel when="ledger" activeId={tab}>
        <Card>
          <CardHeader title="Credit ledger" subtitle="Immutable balance history" />
          <CardBody className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Before</th>
                  <th className="py-2 pr-3">After</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(account?.ledgerEntries ?? []).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge>{entry.entryType}</Badge>
                    </td>
                    <td
                      className={`py-2 pr-3 font-medium ${
                        entry.amountKobo < 0 ? "text-emerald-700" : "text-slate-900"
                      }`}
                    >
                      {entry.amountKobo > 0 ? "+" : ""}
                      {formatNaira(entry.amountKobo)}
                    </td>
                    <td className="py-2 pr-3">{formatNaira(entry.balanceBeforeKobo)}</td>
                    <td className="py-2 pr-3">{formatNaira(entry.balanceAfterKobo)}</td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {entry.referenceType
                        ? `${entry.referenceType}${entry.referenceId ? ` · ${entry.referenceId.slice(0, 8)}` : ""}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs">{ledgerReason(entry)}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {entry.createdByName ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!account?.ledgerEntries.length ? (
              <p className="text-sm text-slate-500">No ledger entries.</p>
            ) : null}
          </CardBody>
        </Card>
      </TabPanel>

      <TabPanel when="payroll" activeId={tab}>
        <Card>
          <CardHeader
            title="Payroll deductions"
            subtitle="Expected vs actual for this employee"
          />
          <CardBody className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Payroll date</th>
                  <th className="py-2 pr-3">Expected</th>
                  <th className="py-2 pr-3">Actual</th>
                  <th className="py-2 pr-3">Difference</th>
                  <th className="py-2 pr-3">Line</th>
                  <th className="py-2">Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(employee.payrollLines ?? []).map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 pr-3">
                      {formatDate(line.payrollRun.payrollDate)}
                    </td>
                    <td className="py-2 pr-3">{formatNaira(line.requestedKobo)}</td>
                    <td className="py-2 pr-3">{formatNaira(line.collectedKobo)}</td>
                    <td className="py-2 pr-3">
                      {formatNaira(line.differenceKobo ?? line.requestedKobo - line.collectedKobo)}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge>{line.status}</Badge>
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/payroll/${line.payrollRun.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {line.payrollRun.status.replaceAll("_", " ")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(employee.payrollLines ?? []).length ? (
              <p className="text-sm text-slate-500">No payroll lines.</p>
            ) : null}
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Verification documents" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {employee.verificationDocuments.map((document) => (
                <a
                  key={document.id}
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 p-3 hover:border-indigo-300"
                >
                  <p className="font-medium text-slate-800">
                    {document.type.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {document.fileName} · {document.status}
                  </p>
                </a>
              ))}
              {!employee.verificationDocuments.length ? (
                <p className="text-sm text-slate-500">No documents uploaded.</p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </TabPanel>

      <Dialog
        open={confirm != null}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel="Confirm"
        confirmVariant={
          confirm?.kind === "adjust" || confirm?.kind === "freeze"
            ? "danger"
            : "primary"
        }
        loading={busyId === confirm?.kind}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />
    </div>
  );
}
