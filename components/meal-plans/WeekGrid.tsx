"use client";

import type { MealPlanDay, MealPlanItem } from "@/lib/types";

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

export type SlotState = "empty" | "needs_directions" | "complete" | "cooked";

export function slotItem(day: MealPlanDay, slot: string): MealPlanItem | undefined {
  return day.items.find((item) => item.mealSlot.toLowerCase() === slot);
}

export function slotState(item?: MealPlanItem): SlotState {
  if (!item) return "empty";
  if (item.cookedAt) return "cooked";
  const hasProduct = Boolean(item.productId || (item.recipe?.ingredients.length ?? 0) > 0);
  const hasSteps =
    (item.recipe?.instructionSteps.length ?? 0) > 0 ||
    Boolean(item.recipe?.instructions?.trim());
  if (hasProduct && hasSteps) return "complete";
  return "needs_directions";
}

const SLOT_STYLES: Record<SlotState, string> = {
  empty: "border-dashed border-slate-300 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600",
  needs_directions:
    "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300",
  cooked: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:border-indigo-300",
};

export function SlotCard({
  item,
  slot,
  selected,
  onClick,
}: {
  item?: MealPlanItem;
  slot: string;
  selected: boolean;
  onClick: () => void;
}) {
  const state = slotState(item);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-22 w-full flex-col rounded-xl border px-3 py-2 text-left transition ${SLOT_STYLES[state]} ${
        selected ? "ring-2 ring-indigo-500" : ""
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {slot}
      </span>
      {item ? (
        <>
          <span className="mt-1 line-clamp-2 text-sm font-semibold">{item.title}</span>
          <span className="mt-auto pt-1 text-[11px]">
            {state === "cooked"
              ? "Cooked"
              : state === "complete"
                ? "Ready"
                : "Add directions"}
          </span>
        </>
      ) : (
        <span className="mt-2 text-sm">+ Add meal</span>
      )}
    </button>
  );
}

export function WeekGrid({
  days,
  selected,
  onSelect,
  weekStartIndex,
}: {
  days: MealPlanDay[];
  selected: { dayId: string; slot: string } | null;
  onSelect: (day: MealPlanDay, slot: string) => void;
  weekStartIndex: number;
}) {
  const visible = days.slice(weekStartIndex, weekStartIndex + 7);
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-180 gap-2"
        style={{ gridTemplateColumns: `88px repeat(${visible.length}, minmax(0, 1fr))` }}
      >
        <div />
        {visible.map((day) => (
          <div key={day.id} className="px-1 text-center">
            <p className="text-xs font-semibold text-slate-500">{day.label || `Day ${day.dayIndex}`}</p>
            <p className="text-sm font-semibold text-slate-900">
              {day.planDate ? day.planDate.slice(8, 10) : day.dayIndex}
            </p>
          </div>
        ))}
        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="contents">
            <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              {slot}
            </div>
            {visible.map((day) => {
              const item = slotItem(day, slot);
              return (
                <SlotCard
                  key={`${day.id}-${slot}`}
                  slot={slot}
                  item={item}
                  selected={selected?.dayId === day.id && selected.slot === slot}
                  onClick={() => onSelect(day, slot)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
