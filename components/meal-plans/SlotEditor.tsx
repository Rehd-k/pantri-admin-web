"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  AiProviderChoice,
  AiSlotSuggestion,
  CatalogProductPick,
  MealPlanDetail,
  MealPlanItem,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { AiProviderMenu } from "./AiProviderMenu";
import { ProductSearchList } from "./ProductSearchList";
import { StepEditor } from "./StepEditor";

type IngredientDraft = {
  productId: string;
  name: string;
  quantity: number;
};

export function SlotEditor({
  plan,
  dayId,
  slot,
  item,
  provider,
  onProviderChange,
  onClose,
  onSaved,
  onError,
}: {
  plan: MealPlanDetail;
  dayId: string;
  slot: string;
  item?: MealPlanItem;
  provider: AiProviderChoice;
  onProviderChange: (value: AiProviderChoice) => void;
  onClose: () => void;
  onSaved: (plan: MealPlanDetail) => void;
  onError: (message: string) => void;
}) {
  const editable = plan.status === "DRAFT" || plan.status === "PENDING_REVIEW";
  const [title, setTitle] = useState(item?.title ?? "");
  const [rationale, setRationale] = useState(item?.rationale ?? "");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    item?.recipe?.ingredients.map((row) => ({
      productId: row.productId,
      name: row.productName,
      quantity: row.quantity,
    })) ??
      (item?.productId
        ? [{ productId: item.productId, name: item.productName ?? "", quantity: item.quantity }]
        : []),
  );
  const [steps, setSteps] = useState<string[]>(
    item?.recipe?.instructionSteps?.length
      ? item.recipe.instructionSteps
      : item?.recipe?.instructions
        ? item.recipe.instructions.split(/\n+/).map((line) => line.replace(/^\s*\d+[\.)]\s*/, "").trim()).filter(Boolean)
        : [],
  );
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    setTitle(item?.title ?? "");
    setRationale(item?.rationale ?? "");
    setIngredients(
      item?.recipe?.ingredients.map((row) => ({
        productId: row.productId,
        name: row.productName,
        quantity: row.quantity,
      })) ??
        (item?.productId
          ? [{ productId: item.productId, name: item.productName ?? "", quantity: item.quantity }]
          : []),
    );
    setSteps(
      item?.recipe?.instructionSteps?.length
        ? item.recipe.instructionSteps
        : [],
    );
  }, [item, dayId, slot]);

  async function save() {
    if (!title.trim() || ingredients.length === 0) {
      onError("Give the meal a name and at least one catalog product.");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.post<MealPlanDetail>(`/admin/meal-plans/${plan.id}/items`, {
        dayId,
        mealSlot: slot,
        title: title.trim(),
        rationale: rationale.trim(),
        ingredients: ingredients.map((row) => ({
          productId: row.productId,
          quantity: row.quantity,
        })),
        instructionSteps: steps.map((step) => step.trim()).filter(Boolean),
      });
      onSaved(updated);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not save this meal.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDirections() {
    if (!item) {
      await save();
      return;
    }
    const cleaned = steps.map((step) => step.trim()).filter(Boolean);
    if (ingredients.length === 0 || cleaned.length === 0) {
      onError("Directions need catalog products and at least one step.");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.put<MealPlanDetail>(
        `/admin/meal-plans/${plan.id}/items/${item.id}/recipe`,
        {
          title: title.trim(),
          rationale: rationale.trim(),
          ingredients: ingredients.map((row) => ({
            productId: row.productId,
            quantity: row.quantity,
          })),
          instructionSteps: cleaned,
        },
      );
      onSaved(updated);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not save directions.");
    } finally {
      setBusy(false);
    }
  }

  async function askAi() {
    setAiBusy(true);
    try {
      const suggestion = await api.post<AiSlotSuggestion>(
        `/admin/meal-plans/${plan.id}/ai/suggest-slot`,
        { provider, dayId, mealSlot: slot, apply: false },
      );
      setTitle(suggestion.title);
      setRationale(suggestion.rationale);
      setSteps(suggestion.instructionSteps);
      const names = new Map(ingredients.map((row) => [row.productId, row.name]));
      const catalog = await Promise.all(
        suggestion.ingredients.map(async (row) => {
          const known = names.get(row.productId);
          if (known) {
            return { productId: row.productId, name: known, quantity: row.quantity ?? 1 };
          }
          const matches = await api.get<CatalogProductPick[]>(
            `/admin/nutrition/catalog-products?q=&take=40`,
          );
          const match = matches.find((product) => product.id === row.productId);
          return {
            productId: row.productId,
            name: match?.name ?? "Catalog product",
            quantity: row.quantity ?? 1,
          };
        }),
      );
      setIngredients(matchKnown(suggestion.ingredients, catalog));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "AI could not suggest this slot.");
    } finally {
      setAiBusy(false);
    }
  }

  async function removeMeal() {
    if (!item) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      const updated = await api.delete<MealPlanDetail>(
        `/admin/meal-plans/${plan.id}/items/${item.id}`,
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not remove this meal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{slot}</p>
          <h2 className="text-lg font-semibold text-slate-900">
            {item ? "Edit meal" : "Add meal"}
          </h2>
        </div>
        <button type="button" className="text-slate-400" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {item?.cookedAt ? (
          <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            The employee cooked this meal.
          </p>
        ) : null}
        <Field label="Meal name">
          <Input
            value={title}
            disabled={!editable}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Jollof rice with chicken"
          />
        </Field>
        <Field label="Why this meal" hint="Shown to the employee with their goals.">
          <Input
            value={rationale}
            disabled={!editable}
            onChange={(e) => setRationale(e.target.value)}
          />
        </Field>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Foods from catalog</p>
          <div className="mb-2 space-y-2">
            {ingredients.map((row) => (
              <div key={row.productId} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <p className="flex-1 text-sm text-slate-800">{row.name}</p>
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  disabled={!editable}
                  className="w-16"
                  onChange={(e) =>
                    setIngredients(
                      ingredients.map((itemRow) =>
                        itemRow.productId === row.productId
                          ? { ...itemRow, quantity: Number(e.target.value) || 1 }
                          : itemRow,
                      ),
                    )
                  }
                />
                {editable ? (
                  <button
                    type="button"
                    className="text-xs text-rose-500"
                    onClick={() =>
                      setIngredients(ingredients.filter((itemRow) => itemRow.productId !== row.productId))
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {editable ? (
            <ProductSearchList
              selectedIds={ingredients.map((row) => row.productId)}
              onAdd={(product) =>
                setIngredients([
                  ...ingredients,
                  { productId: product.id, name: product.name, quantity: 1 },
                ])
              }
            />
          ) : null}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">How to prepare</p>
          {editable ? (
            <StepEditor steps={steps.length ? steps : [""]} onChange={setSteps} />
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
      {editable ? (
        <div className="space-y-3 border-t border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AiProviderMenu value={provider} onChange={onProviderChange} />
            <Button variant="secondary" loading={aiBusy} onClick={() => void askAi()}>
              Ask AI for this meal
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button loading={busy} onClick={() => void save()}>
              Save meal
            </Button>
            <Button variant="secondary" loading={busy} onClick={() => void saveDirections()}>
              Save directions
            </Button>
            {item ? (
              <Button variant="danger" loading={busy} onClick={() => void removeMeal()}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function matchKnown(
  suggested: Array<{ productId: string; quantity?: number }>,
  catalog: IngredientDraft[],
): IngredientDraft[] {
  return suggested.map((row, index) => ({
    productId: row.productId,
    name: catalog[index]?.name ?? "Catalog product",
    quantity: row.quantity ?? 1,
  }));
}
