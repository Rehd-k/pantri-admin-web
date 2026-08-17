"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { CreateCategoryInput, MarketplaceCategory, UpdateCategoryInput } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { ImageField } from "@/components/cms/ImageField";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export function CategoryForm({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(categoryId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    imageUrl: "",
    accentColor: "#F5E6C8",
    sortOrder: "0",
    isActive: true,
  });

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await api.get<MarketplaceCategory[]>("/admin/marketplace/categories");
        const match = rows.find((row) => row.id === categoryId);
        if (!match) throw new Error("Category not found.");
        if (!cancelled) {
          setForm({
            name: match.name,
            imageUrl: match.imageUrl,
            accentColor: match.accentColor,
            sortOrder: String(match.sortOrder),
            isActive: match.isActive,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load category.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: CreateCategoryInput = {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim(),
      accentColor: form.accentColor.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && categoryId) {
        await api.patch<MarketplaceCategory>(
          `/admin/marketplace/categories/${categoryId}`,
          payload as UpdateCategoryInput,
        );
        setSuccess("Category updated.");
      } else {
        await api.post<MarketplaceCategory>("/admin/marketplace/categories", payload);
        router.push("/marketplace/categories");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!categoryId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/marketplace/categories/${categoryId}/deactivate`);
      router.push("/marketplace/categories");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate category.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading category…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={MARKETPLACE_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit category" : "New category"}
        </h1>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Category" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Rice & Grains"
              />
            </Field>
            <Field label="Accent color" hint="Hex like #F5E6C8">
              <Input
                required
                value={form.accentColor}
                onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
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
            <div className="sm:col-span-2">
              <ImageField
                label="Image"
                required
                value={form.imageUrl}
                onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
              />
            </div>
          </CardBody>
        </Card>
        <div className="flex justify-end gap-2">
          {isEdit ? (
            <Button type="button" variant="danger" loading={deactivating} onClick={() => void handleDeactivate()}>
              Deactivate
            </Button>
          ) : null}
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
