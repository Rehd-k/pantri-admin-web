"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { koboToNairaInput, nairaToKobo, unitSizeLabel } from "@/lib/format";
import type {
  CreateProductInput,
  CreateProductPackInput,
  MarketplaceCategory,
  MarketplaceProduct,
  MarketplaceSubcategory,
  MeasureFamily,
  MeasureUnit,
  PerfectForItem,
  ProductPack,
  UpdateProductInput,
  UpdateProductPackInput,
} from "@/lib/types";
import { CmsSubnav, MARKETPLACE_NAV } from "@/components/cms/CmsSubnav";
import { ImageField } from "@/components/cms/ImageField";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

interface NutritionRow {
  key: string;
  value: string;
}

interface PackDraft {
  id?: string;
  brand: string;
  packUnitId: string;
  packAmount: string;
  packageLabel: string;
  priceNaira: string;
  retailNaira: string;
  imageUrl: string;
  isActive: boolean;
}

const CANONICAL_NUTRITION_KEYS: NutritionRow[] = [
  { key: "Calories", value: "" },
  { key: "Protein", value: "" },
  { key: "Carbohydrates", value: "" },
  { key: "Fat", value: "" },
  { key: "Fiber", value: "" },
  { key: "Sugar", value: "" },
  { key: "Sodium", value: "" },
  { key: "Iron", value: "" },
];

function emptyPack(unitId = ""): PackDraft {
  return {
    brand: "",
    packUnitId: unitId,
    packAmount: "1",
    packageLabel: "",
    priceNaira: "",
    retailNaira: "",
    imageUrl: "",
    isActive: true,
  };
}

function packFromApi(pack: ProductPack): PackDraft {
  return {
    id: pack.id,
    brand: pack.brand,
    packUnitId: pack.packUnitId,
    packAmount: String(pack.packAmount),
    packageLabel: pack.packageLabel,
    priceNaira: koboToNairaInput(pack.priceKobo),
    retailNaira: koboToNairaInput(pack.retailPriceKobo),
    imageUrl: pack.imageUrl,
    isActive: pack.isActive,
  };
}

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MarketplaceSubcategory[]>([]);
  const [families, setFamilies] = useState<MeasureFamily[]>([]);
  const [units, setUnits] = useState<MeasureUnit[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    subcategoryId: "",
    measureFamilyId: "",
    recipeUnitId: "",
    name: "",
    slug: "",
    imageUrl: "",
    description: "",
    origin: "",
    expiresAt: "",
    isVerified: false,
    bulkAllocationClaimedPercent: "0",
    tags: "",
    sortOrder: "0",
    isActive: true,
  });
  const [nutrition, setNutrition] = useState<NutritionRow[]>([]);
  const [perfectFor, setPerfectFor] = useState<PerfectForItem[]>([]);
  const [packs, setPacks] = useState<PackDraft[]>([emptyPack()]);

  const filteredSubcategories = useMemo(
    () => subcategories.filter((row) => row.categoryId === form.categoryId),
    [subcategories, form.categoryId],
  );

  const purchaseUnits = useMemo(
    () => units.filter((unit) => unit.isPurchaseUnit && unit.isActive),
    [units],
  );

  const selectedFamily = useMemo(
    () => families.find((family) => family.id === form.measureFamilyId) ?? null,
    [families, form.measureFamilyId],
  );

  const recipeUnits = useMemo(() => {
    return units.filter((unit) => {
      if (!unit.isRecipeUnit) return false;
      if (!unit.isActive && unit.id !== form.recipeUnitId) return false;
      if (selectedFamily && unit.dimension !== selectedFamily.dimension) return false;
      return true;
    });
  }, [units, selectedFamily, form.recipeUnitId]);

  const selectedRecipeUnit = useMemo(
    () => recipeUnits.find((unit) => unit.id === form.recipeUnitId) ?? null,
    [recipeUnits, form.recipeUnitId],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, subs, familyRows, unitRows] = await Promise.all([
          api.get<MarketplaceCategory[]>("/admin/marketplace/categories"),
          api.get<MarketplaceSubcategory[]>("/admin/marketplace/subcategories"),
          api.get<MeasureFamily[]>("/admin/measures/families"),
          api.get<MeasureUnit[]>("/admin/measures/units"),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setSubcategories(subs);
        setFamilies(familyRows);
        setUnits(unitRows);
        const defaultUnit =
          unitRows.find((unit) => unit.isPurchaseUnit && unit.isActive)?.id ?? "";
        if (productId) {
          const match = await api.get<MarketplaceProduct>(
            `/admin/marketplace/products/${productId}`,
          );
          if (cancelled) return;
          setForm({
            categoryId: match.categoryId,
            subcategoryId: match.subcategoryId,
            measureFamilyId: match.measureFamilyId,
            recipeUnitId: match.recipeUnitId ?? match.measureFamily.defaultRecipeUnitId ?? "",
            name: match.name,
            slug: match.slug,
            imageUrl: match.imageUrl,
            description: match.description,
            origin: match.origin,
            expiresAt: match.expiresAt ? match.expiresAt.slice(0, 10) : "",
            isVerified: match.isVerified,
            bulkAllocationClaimedPercent: String(match.bulkAllocationClaimedPercent),
            tags: match.tags.join(", "),
            sortOrder: String(match.sortOrder),
            isActive: match.isActive,
          });
          setNutrition(
            Object.entries(match.nutritionFacts).map(([key, value]) => ({ key, value })),
          );
          setPerfectFor(match.perfectFor);
          setPacks(match.packs.length > 0 ? match.packs.map(packFromApi) : [emptyPack(defaultUnit)]);
        } else {
          setPacks([emptyPack(defaultUnit)]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load product.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function nutritionMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const row of nutrition) {
      const key = row.key.trim();
      const value = row.value.trim();
      if (key && value) map[key] = value;
    }
    return map;
  }

  function perfectForItems(): PerfectForItem[] {
    return perfectFor.filter(
      (item) => item.title.trim() && item.description.trim() && item.imageUrl.trim(),
    );
  }

  function parsePacks(): CreateProductPackInput[] | null {
    const parsed: CreateProductPackInput[] = [];
    for (const pack of packs) {
      const packAmount = Number(pack.packAmount);
      const priceKobo = nairaToKobo(pack.priceNaira);
      const retailPriceKobo = nairaToKobo(pack.retailNaira);
      if (!pack.brand.trim() || !pack.packUnitId || !pack.packageLabel.trim()) {
        setError("Each pack needs a brand, unit, and package label.");
        return null;
      }
      if (!Number.isInteger(packAmount) || packAmount < 1) {
        setError("Pack amount must be a whole number of 1 or more.");
        return null;
      }
      if (priceKobo === null || retailPriceKobo === null) {
        setError("Enter valid pack prices in naira.");
        return null;
      }
      parsed.push({
        brand: pack.brand.trim(),
        packUnitId: pack.packUnitId,
        packAmount,
        packageLabel: pack.packageLabel.trim(),
        priceKobo,
        retailPriceKobo,
        imageUrl: pack.imageUrl.trim() || form.imageUrl.trim() || undefined,
        isActive: pack.isActive,
      });
    }
    return parsed;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const bulk = Number(form.bulkAllocationClaimedPercent);
    if (!Number.isInteger(bulk) || bulk < 0 || bulk > 100) {
      setError("Bulk allocation must be 0–100.");
      return;
    }
    const packPayload = parsePacks();
    if (!packPayload) return;
    if (packPayload.length === 0) {
      setError("Add at least one pack.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    const identity = {
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      measureFamilyId: form.measureFamilyId,
      recipeUnitId: form.recipeUnitId || null,
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim() || undefined,
      origin: form.origin.trim() || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isVerified: form.isVerified,
      bulkAllocationClaimedPercent: bulk,
      nutritionFacts: nutritionMap(),
      perfectFor: perfectForItems(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (isEdit && productId) {
        const payload: UpdateProductInput = identity;
        await api.patch<MarketplaceProduct>(`/admin/marketplace/products/${productId}`, payload);
        for (let index = 0; index < packs.length; index += 1) {
          const draft = packs[index];
          const pack = packPayload[index];
          if (draft.id) {
            const update: UpdateProductPackInput = pack;
            await api.patch(`/admin/marketplace/packs/${draft.id}`, update);
          } else {
            await api.post(`/admin/marketplace/products/${productId}/packs`, pack);
          }
        }
        setSuccess("Product and packs updated.");
      } else {
        const payload: CreateProductInput = { ...identity, packs: packPayload };
        await api.post<MarketplaceProduct>("/admin/marketplace/products", payload);
        router.push("/marketplace/products");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!productId) return;
    setDeactivating(true);
    setError(null);
    try {
      await api.patch(`/admin/marketplace/products/${productId}/deactivate`);
      router.push("/marketplace/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate product.");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) return <Spinner label="Loading product…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <CmsSubnav items={MARKETPLACE_NAV} />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit product" : "New product"}
        </h1>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Identity" subtitle="The food itself  packs and prices live below" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: "" }))
                }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subcategory">
              <Select
                required
                value={form.subcategoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, subcategoryId: e.target.value }))}
              >
                <option value="">Select subcategory</option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Measure family">
              <Select
                required
                value={form.measureFamilyId}
                onChange={(e) => {
                  const familyId = e.target.value;
                  const family = families.find((row) => row.id === familyId);
                  setForm((prev) => ({
                    ...prev,
                    measureFamilyId: familyId,
                    recipeUnitId: family?.defaultRecipeUnitId ?? "",
                  }));
                }}
              >
                <option value="">Select family</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <Field
                label="Household unit"
                hint={selectedRecipeUnit ? unitSizeLabel(selectedRecipeUnit) : "How many cups in a kg, or pours in a litre"}
              >
                <Select
                  required
                  value={form.recipeUnitId}
                  onChange={(e) => setForm((prev) => ({ ...prev, recipeUnitId: e.target.value }))}
                >
                  <option value="">Select unit</option>
                  {recipeUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.shortLabel})
                    </option>
                  ))}
                </Select>
              </Field>
              <Link href="/marketplace/measures" className="mt-1 inline-block text-xs font-medium text-indigo-600">
                Manage units
              </Link>
            </div>
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Field>
            <Field label="Slug" hint="Optional. Auto-generated from the name if empty.">
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </Field>
            <Field label="Origin">
              <Input
                value={form.origin}
                onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
              />
            </Field>
            <Field label="Expires">
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <Input
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
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
            <Field label="Bulk allocation claimed %" hint="0–100">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.bulkAllocationClaimedPercent}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bulkAllocationClaimedPercent: e.target.value }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={(e) => setForm((prev) => ({ ...prev, isVerified: e.target.checked }))}
              />
              Verified
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
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Field>
            </div>
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

        <Card>
          <CardHeader
            title="Sellable packs"
            subtitle="Customers pick a pack size, then how many packs"
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPacks((prev) => [
                    ...prev,
                    emptyPack(purchaseUnits[0]?.id ?? ""),
                  ])
                }
              >
                Add pack
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-4">
            {packs.map((pack, index) => (
              <div key={pack.id ?? `new-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-2">
                <Field label="Brand">
                  <Input
                    required
                    value={pack.brand}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, brand: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
                <Field label="Package label" hint="e.g. 10kg">
                  <Input
                    required
                    value={pack.packageLabel}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, packageLabel: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Unit">
                  <Select
                    required
                    value={pack.packUnitId}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, packUnitId: e.target.value } : row,
                        ),
                      )
                    }
                  >
                    <option value="">Select unit</option>
                    {purchaseUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.shortLabel})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Amount" hint="Whole number of the selected unit">
                  <Input
                    required
                    type="number"
                    min={1}
                    value={pack.packAmount}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, packAmount: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Wholesale price (₦)">
                  <Input
                    required
                    inputMode="decimal"
                    value={pack.priceNaira}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, priceNaira: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Retail price (₦)">
                  <Input
                    required
                    inputMode="decimal"
                    value={pack.retailNaira}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, retailNaira: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <ImageField
                    label="Pack image"
                    value={pack.imageUrl}
                    onChange={(imageUrl) =>
                      setPacks((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, imageUrl } : row)),
                      )
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={pack.isActive}
                    onChange={(e) =>
                      setPacks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, isActive: e.target.checked } : row,
                        ),
                      )
                    }
                  />
                  Active
                </label>
                {packs.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPacks((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove pack
                  </Button>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Nutrition facts (per 100g)"
            action={
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setNutrition((prev) => {
                      const have = new Set(prev.map((row) => row.key.trim().toLowerCase()));
                      const missing = CANONICAL_NUTRITION_KEYS.filter(
                        (row) => !have.has(row.key.toLowerCase()),
                      );
                      return [...prev, ...missing];
                    })
                  }
                >
                  Canonical keys
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setNutrition((prev) => [...prev, { key: "", value: "" }])}
                >
                  Add row
                </Button>
              </div>
            }
          />
          <CardBody className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              Use Calories, Protein, Carbohydrates, Fat, Fiber, Sugar, Sodium, and Iron so
              comparison and meal tracking stay consistent. Values are per 100g.
            </p>
            {nutrition.length === 0 ? (
              <p className="text-sm text-slate-500">No nutrition rows yet.</p>
            ) : (
              nutrition.map((row, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Calories"
                    value={row.key}
                    onChange={(e) =>
                      setNutrition((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item)),
                      )
                    }
                  />
                  <Input
                    placeholder="350 kcal"
                    value={row.value}
                    onChange={(e) =>
                      setNutrition((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, value: e.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setNutrition((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Perfect for"
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPerfectFor((prev) => [...prev, { title: "", description: "", imageUrl: "" }])
                }
              >
                Add item
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-4">
            {perfectFor.length === 0 ? (
              <p className="text-sm text-slate-500">No perfect-for items yet.</p>
            ) : (
              perfectFor.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3">
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) =>
                      setPerfectFor((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                      )
                    }
                  />
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      setPerfectFor((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, description: e.target.value } : row,
                        ),
                      )
                    }
                  />
                  <ImageField
                    label="Image"
                    value={item.imageUrl}
                    onChange={(imageUrl) =>
                      setPerfectFor((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, imageUrl } : row)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPerfectFor((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))
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
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
