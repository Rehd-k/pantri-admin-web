"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type {
  CreateSubcategoryInput,
  MarketplaceCategory,
  MarketplaceSubcategory,
} from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export function SubcategoryForm({ subcategoryId }: { subcategoryId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(subcategoryId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    sortOrder: "0",
    isActive: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cats = await api.get<MarketplaceCategory[]>("/admin/marketplace/categories");
        if (cancelled) return;
        setCategories(cats);
        if (subcategoryId) {
          const rows = await api.get<MarketplaceSubcategory[]>("/admin/marketplace/subcategories");
          const match = rows.find((row) => row.id === subcategoryId);
          if (!match) throw new Error("Subcategory not found.");
          if (!cancelled) {
            setForm({
              categoryId: match.categoryId,
              name: match.name,
              sortOrder: String(match.sortOrder),
              isActive: match.isActive,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load subcategory.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [subcategoryId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: CreateSubcategoryInput = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && subcategoryId) {
        await api.patch(`/admin/marketplace/subcategories/${subcategoryId}`, {
          name: payload.name,
          sortOrder: payload.sortOrder,
          isActive: payload.isActive,
        });
        setSuccess("Subcategory updated.");
      } else {
        await api.post("/admin/marketplace/subcategories", payload);
        router.push("/marketplace/subcategories");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save subcategory.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!subcategoryId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/marketplace/subcategories/${subcategoryId}/deactivate`);
      router.push("/marketplace/subcategories");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate subcategory.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading subcategory…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={MARKETPLACE_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit subcategory" : "New subcategory"}
        </h1>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Subcategory" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                required
                value={form.categoryId}
                disabled={isEdit}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
            {isEdit ? "Save changes" : "Create subcategory"}
          </Button>
        </div>
      </form>
    </div>
  );
}
