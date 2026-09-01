"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Allergy } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export default function AllergiesPage() {
  const [rows, setRows] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", sortOrder: "" });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Allergy[]>("/admin/nutrition/allergies");
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load allergies.");
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
      await api.post("/admin/nutrition/allergies", {
        name: form.name.trim(),
        ...(form.sortOrder ? { sortOrder: Number(form.sortOrder) } : {}),
      });
      setSuccess("Allergy added.");
      setForm({ name: "", sortOrder: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create allergy.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/nutrition/allergies/${id}/deactivate`);
      setSuccess("Allergy deactivated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate allergy.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Allergy>[] = [
    { header: "Name", accessor: (row) => row.name },
    { header: "Slug", accessor: (row) => row.slug },
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
          ""
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Allergies & Sensitivities</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catalog options shown on the employee health questionnaire. Employees can also add custom “Other” allergies.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <Card>
        <CardHeader title="Add allergy" subtitle="Name becomes the chip label in the app." />
        <CardBody>
          <form className="grid gap-4 md:grid-cols-[1fr_120px_auto]" onSubmit={handleCreate}>
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Sesame"
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
                Add
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catalog" subtitle={`${rows.length} allergies`} />
        <CardBody>
          {loading ? <Spinner label="Loading allergies…" /> : <DataTable columns={columns} rows={rows} keyFor={(row) => row.id} />}
        </CardBody>
      </Card>
    </div>
  );
}
