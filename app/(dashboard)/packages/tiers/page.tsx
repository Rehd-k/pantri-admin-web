"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira, koboToNairaInput, nairaToKobo } from "@/lib/format";
import type { CreateDiscountTierInput, DiscountTier } from "@/lib/types";
import { CmsSubnav, PACKAGES_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export default function DiscountTiersPage() {
  const [rows, setRows] = useState<DiscountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    minSpendNaira: "",
    discountPercent: "",
    sortOrder: "0",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.get<DiscountTier[]>("/admin/packages/tiers"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load discount tiers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const minSpendKobo = nairaToKobo(form.minSpendNaira);
    const discountPercent = Number(form.discountPercent);
    if (minSpendKobo === null) {
      setError("Enter a valid minimum spend in naira.");
      return;
    }
    if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      setError("Discount percent must be 0–100.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const payload: CreateDiscountTierInput = {
      label: form.label.trim(),
      minSpendKobo,
      discountPercent,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      await api.post("/admin/packages/tiers", payload);
      setSuccess("Discount tier added.");
      setForm({ label: "", minSpendNaira: "", discountPercent: "", sortOrder: "0" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create tier.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/admin/packages/tiers/${id}/deactivate`);
      setSuccess("Tier deactivated.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate tier.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<DiscountTier>[] = [
    { header: "Label", accessor: (row) => row.label },
    { header: "Min spend", accessor: (row) => formatNaira(row.minSpendKobo) },
    { header: "Discount", accessor: (row) => `${row.discountPercent}%` },
    { header: "Order", accessor: (row) => String(row.sortOrder) },
    {
      header: "Status",
      accessor: (row) => <Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "ACTIVE" : "INACTIVE"}</Badge>,
    },
    {
      header: "",
      accessor: (row) =>
        row.isActive ? (
          <Button
            variant="ghost"
            loading={busyId === row.id}
            onClick={() => void handleDeactivate(row.id)}
          >
            Deactivate
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={PACKAGES_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Discount tiers</h1>
        <p className="mt-1 text-sm text-slate-500">Spend thresholds applied to package pricing.</p>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <form onSubmit={handleCreate}>
        <Card>
          <CardHeader title="Add tier" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Label">
              <Input
                required
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              />
            </Field>
            <Field label="Min spend (₦)" hint={`Preview ${koboToNairaInput(nairaToKobo(form.minSpendNaira) ?? 0)}`}>
              <Input
                required
                inputMode="decimal"
                value={form.minSpendNaira}
                onChange={(e) => setForm((prev) => ({ ...prev, minSpendNaira: e.target.value }))}
              />
            </Field>
            <Field label="Discount %">
              <Input
                required
                type="number"
                min={0}
                max={100}
                value={form.discountPercent}
                onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
              />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </Field>
          </CardBody>
        </Card>
        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={submitting}>
            Add tier
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader title="All tiers" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading tiers…" />
          ) : (
            <DataTable columns={columns} rows={rows} keyFor={(row) => row.id} emptyMessage="No discount tiers yet." />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
