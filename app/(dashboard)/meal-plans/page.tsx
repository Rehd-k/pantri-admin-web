"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MealPlanSummary, NutritionEmployee } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

type Tab = "needs" | "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "needs", label: "Needs a plan" },
  { id: "DRAFT", label: "Drafts" },
  { id: "PENDING_REVIEW", label: "Pending review" },
  { id: "APPROVED", label: "Active" },
  { id: "all", label: "All plans" },
];

export default function MealPlansPage() {
  const [tab, setTab] = useState<Tab>("needs");
  const [rows, setRows] = useState<MealPlanSummary[]>([]);
  const [employees, setEmployees] = useState<NutritionEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (tab === "needs") {
        const data = await api.get<NutritionEmployee[]>(
          "/admin/nutrition/employees?needsPlan=true&take=100",
        );
        setEmployees(data);
        setRows([]);
      } else {
        const query = tab === "all" ? "" : `?status=${tab}`;
        const data = await api.get<MealPlanSummary[]>(`/admin/meal-plans${query}`);
        setRows(data);
        setEmployees([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meal plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/admin/meal-plans/${id}/${decision}`);
      setSuccess(decision === "approve" ? "Meal plan published." : "Meal plan rejected.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const planColumns: Column<MealPlanSummary>[] = useMemo(
    () => [
      {
        header: "Employee",
        accessor: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.employeeName}</p>
            <p className="text-xs text-slate-400">{row.employerName}</p>
          </div>
        ),
      },
      { header: "Title", accessor: (row) => row.title },
      {
        header: "Dates",
        accessor: (row) =>
          row.startsOn && row.endsOn ? `${row.startsOn} → ${row.endsOn}` : "—",
      },
      {
        header: "Progress",
        accessor: (row) => (
          <div className="min-w-35">
            <div className="mb-1 flex justify-between text-[11px] text-slate-500">
              <span>
                {row.completeness.filledSlots}/{row.completeness.requiredSlots} meals
              </span>
              <span>
                {row.completeness.cookedCount}/{row.completeness.plannedCount} cooked
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-600"
                style={{
                  width: `${
                    row.completeness.requiredSlots === 0
                      ? 0
                      : Math.round(
                          (row.completeness.filledSlots / row.completeness.requiredSlots) * 100,
                        )
                  }%`,
                }}
              />
            </div>
          </div>
        ),
      },
      { header: "Status", accessor: (row) => <Badge>{row.status}</Badge> },
      { header: "Updated", accessor: (row) => formatDateTime(row.updatedAt) },
      {
        header: "Actions",
        accessor: (row) => (
          <div className="flex flex-wrap gap-2">
            <Link href={`/meal-plans/${row.id}`}>
              <Button variant="secondary" className="px-2 py-1 text-xs">
                {row.status === "APPROVED" ? "Open" : "Build"}
              </Button>
            </Link>
            {row.status === "PENDING_REVIEW" || row.status === "DRAFT" ? (
              <Button
                variant="primary"
                className="px-2 py-1 text-xs"
                loading={busyId === row.id}
                disabled={!row.completeness.readyToPublish}
                onClick={() => handleDecision(row.id, "approve")}
              >
                Publish
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [busyId],
  );

  const employeeColumns: Column<NutritionEmployee>[] = [
    {
      header: "Employee",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { header: "Company", accessor: (row) => row.employerName },
    {
      header: "Goals",
      accessor: (row) => row.profile?.goals.join(", ") || "—",
    },
    {
      header: "Allergies",
      accessor: (row) => row.profile?.allergies.join(", ") || "None",
    },
    {
      header: "Action",
      accessor: (row) => (
        <Link href={`/meal-plans/new?employeeId=${row.employeeId}`}>
          <Button className="px-2 py-1 text-xs">Create plan</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meal plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build weekly plans from each employee’s goals, then add cooking directions.
          </p>
        </div>
        <Link href="/meal-plans/new">
          <Button>Create meal plan</Button>
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={tab === "needs" ? "Employees waiting" : "Queue"}
          subtitle={tab === "needs" ? `${employees.length} people` : `${rows.length} plans`}
        />
        <CardBody>
          {loading ? (
            <Spinner label="Loading…" />
          ) : tab === "needs" ? (
            <DataTable columns={employeeColumns} rows={employees} keyFor={(row) => row.employeeId} />
          ) : (
            <DataTable columns={planColumns} rows={rows} keyFor={(row) => row.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
