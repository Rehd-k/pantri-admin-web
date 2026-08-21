"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { unitSizeLabel } from "@/lib/format";
import type { CreateMeasureUnitInput, MeasureUnit, UpdateMeasureUnitInput } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

const KINDS = ["PANTRA", "METRIC", "TRADITIONAL", "COUNT"] as const;
const DIMENSIONS = ["MASS", "VOLUME", "COUNT"] as const;

function gramsFromMg(mg: number | null): string {
  if (mg == null) return "";
  const grams = mg / 1000;
  return Number.isInteger(grams) ? String(grams) : String(grams);
}

export function MeasureUnitForm({ unitId }: { unitId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(unitId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortLabel: "",
    kind: "PANTRA",
    dimension: "MASS",
    grams: "150",
    millilitres: "250",
    piecesPerUnit: "1",
    isRecipeUnit: true,
    isPurchaseUnit: false,
    sortOrder: "0",
    isActive: true,
  });

  useEffect(() => {
    if (!unitId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await api.get<MeasureUnit[]>("/admin/measures/units");
        const match = rows.find((row) => row.id === unitId);
        if (!match) throw new Error("Unit not found.");
        if (!cancelled) {
          setForm({
            name: match.name,
            slug: match.slug,
            shortLabel: match.shortLabel,
            kind: match.kind,
            dimension: match.dimension,
            grams: gramsFromMg(match.milligrams),
            millilitres: match.millilitres != null ? String(match.millilitres) : "",
            piecesPerUnit: match.piecesPerUnit != null ? String(match.piecesPerUnit) : "1",
            isRecipeUnit: match.isRecipeUnit,
            isPurchaseUnit: match.isPurchaseUnit,
            sortOrder: String(match.sortOrder),
            isActive: match.isActive,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load unit.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  const preview = useMemo(() => {
    const grams = Number(form.grams);
    const millilitres = Number(form.millilitres);
    const pieces = Number(form.piecesPerUnit);
    return unitSizeLabel({
      name: form.name.trim() || "this unit",
      dimension: form.dimension,
      milligrams: form.dimension === "MASS" && Number.isFinite(grams) ? Math.round(grams * 1000) : null,
      millilitres: form.dimension === "VOLUME" && Number.isFinite(millilitres) ? millilitres : null,
      piecesPerUnit: form.dimension === "COUNT" && Number.isFinite(pieces) ? pieces : null,
    });
  }, [form]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const grams = Number(form.grams);
    const millilitres = Number(form.millilitres);
    const pieces = Number(form.piecesPerUnit);
    const payload: CreateMeasureUnitInput = {
      name: form.name.trim(),
      shortLabel: form.shortLabel.trim(),
      kind: form.kind,
      dimension: form.dimension,
      milligrams: form.dimension === "MASS" ? Math.round(grams * 1000) : null,
      millilitres: form.dimension === "VOLUME" ? millilitres : null,
      piecesPerUnit: form.dimension === "COUNT" ? pieces : null,
      isRecipeUnit: form.isRecipeUnit,
      isPurchaseUnit: form.isPurchaseUnit,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && unitId) {
        const update: UpdateMeasureUnitInput = payload;
        await api.patch(`/admin/measures/units/${unitId}`, update);
        setSuccess("Unit updated. Product pages will use this name and size immediately.");
      } else {
        await api.post("/admin/measures/units", {
          ...payload,
          slug: form.slug.trim() || undefined,
        });
        router.push("/marketplace/measures");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save unit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!unitId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/measures/units/${unitId}/deactivate`);
      router.push("/marketplace/measures");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate unit.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading unit…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={MARKETPLACE_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit unit" : "New unit"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          These are the household measures customers see — cups, pours, spoons, scoops. Rename them anytime.
        </p>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Unit of measure" subtitle={preview} />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" hint='Shown in the app, e.g. "Pantra Cup"'>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Field>
            <Field label="Short label" hint="PC, PP, g, ml">
              <Input
                required
                value={form.shortLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, shortLabel: e.target.value }))}
              />
            </Field>
            {!isEdit ? (
              <Field label="Slug" hint="Optional. Generated from the name if empty.">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                />
              </Field>
            ) : null}
            <Field label="Kind">
              <Select
                value={form.kind}
                onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value }))}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dimension">
              <Select
                value={form.dimension}
                onChange={(e) => setForm((prev) => ({ ...prev, dimension: e.target.value }))}
              >
                {DIMENSIONS.map((dimension) => (
                  <option key={dimension} value={dimension}>
                    {dimension === "MASS" ? "Mass (kg / cups)" : dimension === "VOLUME" ? "Volume (litres / pours)" : "Count (pieces)"}
                  </option>
                ))}
              </Select>
            </Field>
            {form.dimension === "MASS" ? (
              <Field label="Grams in one unit" hint="A kilogram is 1000g. 150g means about 6.7 of this unit per kg.">
                <Input
                  required
                  inputMode="decimal"
                  value={form.grams}
                  onChange={(e) => setForm((prev) => ({ ...prev, grams: e.target.value }))}
                />
              </Field>
            ) : null}
            {form.dimension === "VOLUME" ? (
              <Field label="Millilitres in one unit" hint="A litre is 1000ml. 250ml means 4 of this unit per litre.">
                <Input
                  required
                  type="number"
                  min={1}
                  value={form.millilitres}
                  onChange={(e) => setForm((prev) => ({ ...prev, millilitres: e.target.value }))}
                />
              </Field>
            ) : null}
            {form.dimension === "COUNT" ? (
              <Field label="Pieces in one unit">
                <Input
                  required
                  type="number"
                  min={1}
                  value={form.piecesPerUnit}
                  onChange={(e) => setForm((prev) => ({ ...prev, piecesPerUnit: e.target.value }))}
                />
              </Field>
            ) : null}
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isRecipeUnit}
                onChange={(e) => setForm((prev) => ({ ...prev, isRecipeUnit: e.target.checked }))}
              />
              Recipe / household unit (shown on product pages)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPurchaseUnit}
                onChange={(e) => setForm((prev) => ({ ...prev, isPurchaseUnit: e.target.checked }))}
              />
              Purchase unit (kg, litre, piece for packs)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
          </CardBody>
        </Card>
        <div className="flex justify-end gap-2">
          {isEdit ? (
            <Button type="button" variant="danger" loading={deactivating} onClick={() => void handleDeactivate()}>
              Deactivate
            </Button>
          ) : null}
          <Button type="submit" loading={saving}>
            {isEdit ? "Save unit" : "Create unit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
