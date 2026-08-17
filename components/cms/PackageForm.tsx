"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type {
  AdminPackage,
  CreateAdminPackageInput,
  MarketplaceProduct,
  PackageItemInput,
  ProductListResponse,
  ProductPack,
} from "@/lib/types";
import { CmsSubnav, PACKAGES_NAV } from "@/components/cms/CmsSubnav";
import { ImageField } from "@/components/cms/ImageField";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

interface Line {
  packId: string;
  name: string;
  packageLabel: string;
  brand: string;
  quantity: number;
}

export function PackageForm({ packageId }: { packageId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(packageId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MarketplaceProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    coverImageUrl: "",
    isPopular: false,
    sortOrder: "0",
    isActive: true,
  });
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (!packageId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pkg = await api.get<AdminPackage>(`/packages/${packageId}`);
        if (cancelled) return;
        setForm({
          name: pkg.name,
          description: pkg.description,
          coverImageUrl: pkg.coverImageUrl,
          isPopular: pkg.isPopular,
          sortOrder: String(pkg.sortOrder),
          isActive: pkg.isActive,
        });
        setLines(
          pkg.items.map((item) => ({
            packId: item.packId,
            name: item.name,
            packageLabel: item.packageLabel,
            brand: item.brand,
            quantity: item.quantity,
          })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load package.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  async function searchProducts() {
    setSearching(true);
    try {
      const q = query.trim();
      const path = q
        ? `/admin/marketplace/products?take=20&q=${encodeURIComponent(q)}`
        : "/admin/marketplace/products?take=20";
      const data = await api.get<ProductListResponse>(path);
      setResults(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to search products.");
    } finally {
      setSearching(false);
    }
  }

  function addPack(product: MarketplaceProduct, pack: ProductPack) {
    setLines((prev) => {
      const existing = prev.find((line) => line.packId === pack.id);
      if (existing) {
        return prev.map((line) =>
          line.packId === pack.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          packId: pack.id,
          name: product.name,
          packageLabel: pack.packageLabel,
          brand: pack.brand,
          quantity: 1,
        },
      ];
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (lines.length === 0) {
      setError("Add at least one pack.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const items: PackageItemInput[] = lines.map((line, index) => ({
      packId: line.packId,
      quantity: line.quantity,
      sortOrder: index,
    }));
    const payload: CreateAdminPackageInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      coverImageUrl: form.coverImageUrl.trim(),
      isPopular: form.isPopular,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      items,
    };
    try {
      if (isEdit && packageId) {
        await api.patch(`/admin/packages/${packageId}`, payload);
        setSuccess("Package updated.");
      } else {
        await api.post("/admin/packages", payload);
        router.push("/packages");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save package.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!packageId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/packages/${packageId}/deactivate`);
      router.push("/packages");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate package.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading package…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={PACKAGES_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit package" : "New package"}
        </h1>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Package" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => setForm((prev) => ({ ...prev, isPopular: e.target.checked }))}
              />
              Popular
            </label>
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
                label="Cover image"
                required
                value={form.coverImageUrl}
                onChange={(coverImageUrl) => setForm((prev) => ({ ...prev, coverImageUrl }))}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Line items" subtitle="Search products, then add a specific pack size" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="flex-1"
              />
              <Button type="button" variant="secondary" loading={searching} onClick={() => void searchProducts()}>
                Search
              </Button>
            </div>
            {results.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {results.map((product) => (
                  <li key={product.id} className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">
                      from {formatNaira(product.fromPriceKobo)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.packs
                        .filter((pack) => pack.isActive)
                        .map((pack) => (
                          <Button
                            key={pack.id}
                            type="button"
                            variant="secondary"
                            onClick={() => addPack(product, pack)}
                          >
                            Add {pack.packageLabel} · {formatNaira(pack.priceKobo)}
                          </Button>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {lines.length === 0 ? (
              <p className="text-sm text-slate-500">No packs in this package yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lines.map((line) => (
                  <li key={line.packId} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate-800">
                      {line.name} {line.packageLabel}
                      {line.brand ? ` · ${line.brand}` : ""}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((item) =>
                            item.packId === line.packId
                              ? { ...item, quantity: Math.max(1, Number(e.target.value) || 1) }
                              : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setLines((prev) => prev.filter((item) => item.packId !== line.packId))
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          {isEdit ? (
            <Button type="button" variant="danger" loading={deactivating} onClick={() => void handleDeactivate()}>
              Deactivate
            </Button>
          ) : null}
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create package"}
          </Button>
        </div>
      </form>
    </div>
  );
}
