"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { CreateBannerInput, MarketplaceBanner } from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export function BannerForm({ bannerId }: { bannerId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(bannerId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    badgeLabel: "",
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaRoute: "",
    gradientStart: "#1A3A5C",
    gradientEnd: "#2D6A8F",
    sortOrder: "0",
    isActive: true,
  });

  useEffect(() => {
    if (!bannerId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await api.get<MarketplaceBanner[]>("/admin/marketplace/banners");
        const match = rows.find((row) => row.id === bannerId);
        if (!match) throw new Error("Banner not found.");
        if (!cancelled) {
          setForm({
            badgeLabel: match.badgeLabel,
            title: match.title,
            subtitle: match.subtitle,
            ctaLabel: match.ctaLabel,
            ctaRoute: match.ctaRoute ?? "",
            gradientStart: match.gradientStart,
            gradientEnd: match.gradientEnd,
            sortOrder: String(match.sortOrder),
            isActive: match.isActive,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load banner.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload: CreateBannerInput = {
      badgeLabel: form.badgeLabel.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      ctaLabel: form.ctaLabel.trim(),
      ctaRoute: form.ctaRoute.trim() || null,
      gradientStart: form.gradientStart.trim(),
      gradientEnd: form.gradientEnd.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && bannerId) {
        await api.patch(`/admin/marketplace/banners/${bannerId}`, payload);
        setSuccess("Banner updated.");
      } else {
        await api.post("/admin/marketplace/banners", payload);
        router.push("/marketplace/banners");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save banner.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!bannerId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/marketplace/banners/${bannerId}/deactivate`);
      router.push("/marketplace/banners");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate banner.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading banner…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={MARKETPLACE_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit banner" : "New promo banner"}
        </h1>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Promo banner" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Badge">
              <Input
                required
                value={form.badgeLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, badgeLabel: e.target.value }))}
              />
            </Field>
            <Field label="CTA label">
              <Input
                required
                value={form.ctaLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
              />
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Field>
            <Field label="Subtitle" className="sm:col-span-2">
              <Input
                required
                value={form.subtitle}
                onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              />
            </Field>
            <Field label="CTA route" hint="Optional in-app path">
              <Input
                value={form.ctaRoute}
                onChange={(e) => setForm((prev) => ({ ...prev, ctaRoute: e.target.value }))}
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
            <Field label="Gradient start" hint="Hex like #1A3A5C">
              <Input
                required
                value={form.gradientStart}
                onChange={(e) => setForm((prev) => ({ ...prev, gradientStart: e.target.value }))}
              />
            </Field>
            <Field label="Gradient end" hint="Hex like #2D6A8F">
              <Input
                required
                value={form.gradientEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, gradientEnd: e.target.value }))}
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
            {isEdit ? "Save changes" : "Create banner"}
          </Button>
        </div>
      </form>
    </div>
  );
}
