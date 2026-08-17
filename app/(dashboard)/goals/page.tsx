"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { PrimaryGoal } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export default function GoalsPage() {
  const [rows, setRows] = useState<PrimaryGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    iconKey: "flag",
    sortOrder: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PrimaryGoal[]>("/admin/nutrition/goals");
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/admin/nutrition/goals", {
        name: form.name.trim(),
        description: form.description.trim(),
        iconKey: form.iconKey.trim() || "flag",
        ...(form.sortOrder ? { sortOrder: Number(form.sortOrder) } : {}),
      });
      setSuccess("Goal added.");
      setForm({ name: "", description: "", iconKey: "flag", sortOrder: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/nutrition/goals/${id}/deactivate`);
      setSuccess("Goal deactivated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate goal.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<PrimaryGoal>[] = [
    {
      header: "Goal",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.description || "—"}</p>
        </div>
      ),
    },
    { header: "Icon", accessor: (row) => row.iconKey },
    { header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Active" : "Inactive"}</Badge>,
    },
    {
      header: "Actions",
      accessor: (row) =>
        row.isActive ? (
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            loading={busyId === row.id}
            onClick={() => handleDeactivate(row.id)}
          >
            Deactivate
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Primary Goals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Expandable goal catalog for the questionnaire. Employees can also add custom goals via Other.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <Card>
        <CardHeader title="Add goal" subtitle="Shown as selectable cards in the employee app." />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Better Sleep"
              />
            </Field>
            <Field label="Icon key">
              <Input
                value={form.iconKey}
                onChange={(e) => setForm((prev) => ({ ...prev, iconKey: e.target.value }))}
                placeholder="flag"
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short supporting sentence"
              />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" loading={submitting}>
                Add goal
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catalog" subtitle={`${rows.length} goals`} />
        <CardBody>
          {loading ? <Spinner label="Loading goals…" /> : <DataTable columns={columns} rows={rows} keyFor={(row) => row.id} />}
        </CardBody>
      </Card>
    </div>
  );
}
