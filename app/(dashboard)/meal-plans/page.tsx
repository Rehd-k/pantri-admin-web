"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MealPlanStatus, MealPlanSummary } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

const STATUS_FILTERS: { label: string; value: MealPlanStatus | "" }[] = [
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "All", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];

export default function MealPlansPage() {
  const [rows, setRows] = useState<MealPlanSummary[]>([]);
  const [status, setStatus] = useState<MealPlanStatus | "">("PENDING_REVIEW");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load(currentStatus: MealPlanStatus | "") {
    setLoading(true);
    setError(null);
    try {
      const query = currentStatus ? `?status=${currentStatus}` : "";
      const data = await api.get<MealPlanSummary[]>(`/admin/meal-plans${query}`);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meal plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(status);
  }, [status]);

  async function handleDecision(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/admin/meal-plans/${id}/${decision}`);
      setSuccess(
        decision === "approve"
          ? "Meal plan approved and converted to a pantry package."
          : "Meal plan rejected.",
      );
      await load(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<MealPlanSummary>[] = [
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
    { header: "Status", accessor: (row) => <Badge>{row.status}</Badge> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt) },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/meal-plans/${row.id}`}>
            <Button variant="secondary" className="px-2 py-1 text-xs">
              Review
            </Button>
          </Link>
          {row.status === "PENDING_REVIEW" ? (
            <>
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
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Meal Plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review generated plans before they become private pantry packages for the employee.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.label}
            variant={status === filter.value ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader title="Queue" subtitle={`${rows.length} plans`} />
        <CardBody>
          {loading ? <Spinner label="Loading meal plans…" /> : <DataTable columns={columns} rows={rows} keyFor={(row) => row.id} />}
        </CardBody>
      </Card>
    </div>
  );
}
