"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { CompanyListItem, CreatePickupPointInput, PickupPoint } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

const EMPTY_FORM = {
  label: "",
  addressLine: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  isActive: true,
};

export default function PickupPointsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [companyName, setCompanyName] = useState("Company");
  const [rows, setRows] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [companies, points] = await Promise.all([
        api.get<CompanyListItem[]>("/admin/companies"),
        api.get<PickupPoint[]>(`/admin/companies/${companyId}/pickup-points`),
      ]);
      const match = companies.find((row) => row.id === companyId);
      if (match) setCompanyName(match.name);
      setRows(points);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pickup points.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function startEdit(point: PickupPoint) {
    setEditingId(point.id);
    setForm({
      label: point.label,
      addressLine: point.addressLine,
      city: point.city,
      state: point.state ?? "",
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      isActive: point.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: CreatePickupPointInput = {
      label: form.label.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      latitude,
      longitude,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await api.patch(`/admin/pickup-points/${editingId}`, payload);
        setSuccess("Pickup point updated.");
      } else {
        await api.post(`/admin/companies/${companyId}/pickup-points`, payload);
        setSuccess("Pickup point added.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save pickup point.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/pickup-points/${id}/deactivate`);
      setSuccess("Pickup point deactivated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate pickup point.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<PickupPoint>[] = [
    { header: "Label", accessor: (row) => row.label },
    {
      header: "Address",
      accessor: (row) => `${row.addressLine}, ${row.city}${row.state ? `, ${row.state}` : ""}`,
    },
    {
      header: "Coords",
      accessor: (row) => `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`,
    },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
      header: "",
      accessor: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => startEdit(row)}>
            Edit
          </Button>
          {row.isActive ? (
            <Button variant="ghost" loading={busyId === row.id} onClick={() => void handleDeactivate(row.id)}>
              Deactivate
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/companies" className="text-sm font-medium text-indigo-600">
          ← Companies
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pickup · {companyName}</h1>
        <p className="mt-1 text-sm text-slate-500">Hubs where employees can collect orders.</p>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title={editingId ? "Edit pickup point" : "Add pickup point"} />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Label">
              <Input
                required
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </Field>
            <Field label="City">
              <Input
                required
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input
                required
                value={form.addressLine}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
            <Field label="Latitude">
              <Input
                required
                inputMode="decimal"
                value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              />
            </Field>
            <Field label="Longitude">
              <Input
                required
                inputMode="decimal"
                value={form.longitude}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              />
            </Field>
          </CardBody>
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={saving}>
            {editingId ? "Save pickup point" : "Add pickup point"}
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader title="Pickup points" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading pickup points…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="Add hubs where employees can collect orders."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
