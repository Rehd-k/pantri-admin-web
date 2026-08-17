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
import type { AdminUserDetail, OrderFulfillmentStatus } from "@/lib/types";

const NEXT_STATUS: Partial<
  Record<OrderFulfillmentStatus, OrderFulfillmentStatus>
> = {
  APPROVED: "PROCESSING",
  PROCESSING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "FULFILLED",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUser(await api.get<AdminUserDetail>(`/admin/users/${userId}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load user.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  async function setStatus(action: "approve" | "suspend") {
    setBusyId(action);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/users/${userId}/${action}`, {});
      setSuccess(
        action === "approve" ? "User activated." : "User suspended.",
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status update failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !user) return <Spinner label="Loading user history…" />;
  if (!user) return error ? <ErrorBanner message={error} /> : null;

  const employee = user.employee;
  const account = employee?.creditAccount ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/users" className="text-sm text-indigo-600">
          ← All users
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {user.firstName} {user.lastName}
          </h1>
          <Badge>{user.role}</Badge>
          <Badge>{user.status}</Badge>
          {employee ? <Badge>{employee.verificationStatus}</Badge> : null}
        </div>
        <p className="text-sm text-slate-500">
          {user.email}
          {user.employer ? ` · ${user.employer.name}` : ""}
          {user.businessName ? ` · ${user.businessName}` : ""}
          {user.fleetName ? ` · ${user.fleetName}` : ""}
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <div className="flex flex-wrap gap-2">
        {user.status !== "ACTIVE" ? (
          <Button
            loading={busyId === "approve"}
            onClick={() => setStatus("approve")}
          >
            Activate account
          </Button>
        ) : null}
        {user.status !== "SUSPENDED" ? (
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            loading={busyId === "suspend"}
            onClick={() => setStatus("suspend")}
          >
            Suspend account
          </Button>
        ) : null}
        {employee ? (
          <Link
            href={`/employees/${employee.id}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open employee portal
          </Link>
        ) : null}
        {user.employerId ? (
          <Link
            href={`/companies/${user.employerId}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open company portal
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Joined</p>
            <p className="mt-1 text-sm font-semibold">
              {formatDateTime(user.createdAt)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Orders</p>
            <p className="mt-1 text-xl font-semibold">
              {employee?.orders.length ?? 0}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Credit exposure</p>
            <p className="mt-1 text-xl font-semibold">
              {formatNaira(employee?.exposureKobo ?? 0)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Meal plans</p>
            <p className="mt-1 text-xl font-semibold">
              {employee?.mealPlans.length ?? 0}
            </p>
          </CardBody>
        </Card>
      </div>

      {user.memberships.length ? (
        <Card>
          <CardHeader title="Employer memberships" />
          <CardBody className="divide-y divide-slate-100">
            {user.memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{membership.employerName}</p>
                  <p className="text-xs text-slate-400">{membership.role}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDateTime(membership.createdAt)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {employee ? (
        <>
          <Card>
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

          <Card>
            <CardHeader title="Order history" />
            <CardBody className="flex flex-col gap-4">
              {employee.orders.map((order) => {
                const next = NEXT_STATUS[order.fulfillmentStatus];
                return (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.items
                            .map((item) => `${item.quantity}× ${item.name}`)
                            .join(", ") || order.id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(order.createdAt)} ·{" "}
                          {formatNaira(order.totalKobo)} · {order.creditStatus}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{order.fulfillmentStatus}</Badge>
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.statusHistory.map((history) => (
                        <span
                          key={history.id}
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {history.toStatus} ·{" "}
                          {formatDateTime(history.createdAt)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!employee.orders.length ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : null}
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Credit ledger" subtitle="Latest entries" />
              <CardBody className="divide-y divide-slate-100">
                {account?.ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <div>
                      <p>{entry.entryType.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{formatNaira(entry.amountKobo)}</p>
                      <p className="text-xs text-slate-400">
                        Balance {formatNaira(entry.balanceAfterKobo)}
                      </p>
                    </div>
                  </div>
                ))}
                {!account?.ledgerEntries.length ? (
                  <p className="text-sm text-slate-500">No ledger entries.</p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Salary history" />
              <CardBody className="divide-y divide-slate-100">
                {employee.salaryHistory.map((salary) => (
                  <div
                    key={salary.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <div>
                      <p>{salary.reason ?? "Salary update"}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(salary.effectiveAt)}
                      </p>
                    </div>
                    <p>{formatNaira(salary.salaryKobo)}</p>
                  </div>
                ))}
                {!employee.salaryHistory.length ? (
                  <p className="text-sm text-slate-500">No salary history.</p>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Payroll deduction history" />
              <CardBody className="divide-y divide-slate-100">
                {employee.payrollLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <div>
                      <p>
                        {formatDate(line.payrollRun.payrollDate)} ·{" "}
                        {line.status}
                      </p>
                      <p className="text-xs text-slate-400">
                        Requested {formatNaira(line.requestedKobo)} · collected{" "}
                        {formatNaira(line.collectedKobo)}
                      </p>
                    </div>
                    <Badge>{line.payrollRun.status}</Badge>
                  </div>
                ))}
                {!employee.payrollLines.length ? (
                  <p className="text-sm text-slate-500">No payroll lines.</p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Meal plans & cooked meals" />
              <CardBody className="space-y-4">
                <div className="divide-y divide-slate-100">
                  {employee.mealPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex justify-between py-2 text-sm"
                    >
                      <div>
                        <p>{plan.title}</p>
                        <p className="text-xs text-slate-400">
                          {formatDateTime(plan.createdAt)}
                        </p>
                      </div>
                      <Badge>{plan.status}</Badge>
                    </div>
                  ))}
                  {!employee.mealPlans.length ? (
                    <p className="text-sm text-slate-500">No meal plans.</p>
                  ) : null}
                </div>
                <div className="border-t border-slate-100 pt-3 divide-y divide-slate-100">
                  {employee.cookedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex justify-between py-2 text-sm"
                    >
                      <div>
                        <p>{meal.recipeTitle}</p>
                        <p className="text-xs text-slate-400">
                          {meal.mealSlot} · {formatDateTime(meal.cookedAt)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {meal.energyKcal} kcal
                      </p>
                    </div>
                  ))}
                  {!employee.cookedMeals.length ? (
                    <p className="text-sm text-slate-500">No cooked meals yet.</p>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader title="Role profile" />
          <CardBody className="text-sm text-slate-600">
            This account is not an employee, so there is no order/credit pantry
            history. Use the memberships, packages, audit, and notification
            sections below for activity.
          </CardBody>
        </Card>
      )}

      {user.packagesCreated.length ? (
        <Card>
          <CardHeader title="Packages created" />
          <CardBody className="divide-y divide-slate-100">
            {user.packagesCreated.map((pkg) => (
              <div
                key={pkg.id}
                className="flex justify-between py-2 text-sm"
              >
                <div>
                  <p>{pkg.name}</p>
                  <p className="text-xs text-slate-400">
                    {pkg.kind} · {pkg.visibility}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDateTime(pkg.createdAt)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Audit activity" subtitle="Actions by this user" />
          <CardBody className="divide-y divide-slate-100">
            {user.auditLogs.map((log) => (
              <div key={log.id} className="py-2 text-sm">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-slate-400">
                  {log.entityType}
                  {log.entityId ? ` · ${log.entityId}` : ""} ·{" "}
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
            {!user.auditLogs.length ? (
              <p className="text-sm text-slate-500">No audit events.</p>
            ) : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Notifications" />
          <CardBody className="divide-y divide-slate-100">
            {user.notifications.map((notification) => (
              <div key={notification.id} className="py-2 text-sm">
                <p className="font-medium">{notification.title}</p>
                <p className="text-slate-600">{notification.body}</p>
                <p className="text-xs text-slate-400">
                  {notification.status} · {formatDateTime(notification.createdAt)}
                </p>
              </div>
            ))}
            {!user.notifications.length ? (
              <p className="text-sm text-slate-500">No notifications.</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
