"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AdminOpsSummary, AuthResponse, PendingUser } from "@/lib/types";
import { formatNaira } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export default function OverviewPage() {
  const { applySession } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [ops, setOps] = useState<AdminOpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingNutritionist, setLoadingNutritionist] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pending, summary] = await Promise.all([
        api.get<PendingUser[]>("/admin/pending-users"),
        api.get<AdminOpsSummary>("/admin/ops/summary"),
      ]);
      setPendingUsers(pending);
      setOps(summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function loadNutritionistAccount() {
    setLoadingNutritionist(true);
    setError(null);
    setSuccess(null);
    try {
      const session = await api.post<AuthResponse>("/admin/session/nutritionist");
      applySession(session);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load the nutritionist account.",
      );
    } finally {
      setLoadingNutritionist(false);
    }
  }

  async function handleDecision(id: string, decision: "approve" | "suspend") {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/users/${id}/${decision}`);
      setSuccess(`User ${decision === "approve" ? "approved" : "suspended"}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<PendingUser>[] = [
    {
      header: "Name",
      accessor: (user) => (
        <div>
          <Link
            href={`/users/${user.id}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {user.firstName} {user.lastName}
          </Link>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
      ),
    },
    { header: "Role", accessor: (user) => <Badge tone="info">{user.role}</Badge> },
    {
      header: "Business",
      accessor: (user) => user.businessName ?? user.fleetName ?? user.employerName ?? "",
    },
    { header: "Status", accessor: (user) => <Badge>{user.status}</Badge> },
    {
      header: "Actions",
      accessor: (user) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="px-2 py-1 text-xs"
            loading={busyId === user.id}
            onClick={() => handleDecision(user.id, "approve")}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            loading={busyId === user.id}
            onClick={() => handleDecision(user.id, "suspend")}
          >
            Suspend
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Platform Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Financial posture first, then items that need human action.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {loading && !ops ? (
        <Spinner label="Loading overview…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Outstanding credit"
              value={formatNaira(ops?.totalOutstandingKobo ?? 0)}
              hint="Principal + interest + fees + penalties"
            />
            <StatCard
              label="Active employees"
              value={String(ops?.activeEmployees ?? 0)}
              hint="Across all employers"
              tone="success"
            />
            <StatCard
              label="Purchases this period"
              value={formatNaira(ops?.purchasesThisPeriodKobo ?? 0)}
              hint="Posted purchase ledger entries"
            />
            <StatCard
              label="Payroll gap"
              value={formatNaira(ops?.payrollDifferenceKobo ?? 0)}
              hint={`Expected ${formatNaira(ops?.expectedPayrollKobo ?? 0)} · Received ${formatNaira(ops?.receivedPayrollKobo ?? 0)}`}
              tone={(ops?.payrollDifferenceKobo ?? 0) > 0 ? "danger" : "success"}
            />
          </div>

          {ops?.attentionItems?.length ? (
            <Card>
              <CardHeader
                title="Action required"
                subtitle="Exceptions that need an operator"
              />
              <CardBody className="divide-y divide-slate-100">
                {ops.attentionItems.map((item) => (
                  <Link
                    key={item.type}
                    href={item.href}
                    className="flex items-center justify-between py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.type.replaceAll("_", " ")}</p>
                    </div>
                    <Badge tone="warning">{String(item.count)}</Badge>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <p className="text-sm text-slate-600">
                  No financial exceptions require attention right now.
                </p>
              </CardBody>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending onboarding"
          value={String(pendingUsers.length)}
          hint="Suppliers & logistics partners"
        />
        <StatCard
          label="Write-offs pending"
          value={String(ops?.pendingWriteOffs ?? 0)}
          hint="Dual-approval queue"
          tone={(ops?.pendingWriteOffs ?? 0) > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Orders in flight"
          value={String(ops?.ordersRequiringAttention ?? 0)}
          hint="Open fulfillment pipeline"
        />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">Browse users and employees</p>
            <p className="text-sm text-slate-500">
              Open financial profiles, credit ledgers, and verification history.
            </p>
          </div>
          <Link
            href="/users"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Open Users
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">Load the nutritionist account</p>
            <p className="text-sm text-slate-500">
              Switch into the nutritionist workspace to review meal plans.
            </p>
          </div>
          <Button
            loading={loadingNutritionist}
            onClick={() => void loadNutritionistAccount()}
          >
            Load nutritionist account
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Pending supplier & logistics accounts"
          subtitle="New partner sign-ups awaiting approval before they can transact"
        />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading pending accounts…" />
          ) : (
            <DataTable
              columns={columns}
              rows={pendingUsers}
              keyFor={(user) => user.id}
              emptyMessage="No accounts are waiting on approval."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
