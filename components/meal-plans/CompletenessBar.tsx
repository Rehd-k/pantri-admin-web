import type { MealPlanCompleteness } from "@/lib/types";

const STEPS = [
  { key: "meals", label: "Meals filled" },
  { key: "directions", label: "Directions" },
  { key: "publish", label: "Ready to publish" },
] as const;

export function CompletenessBar({
  completeness,
  hasEmployee,
  hasDates,
}: {
  completeness?: MealPlanCompleteness | null;
  hasEmployee: boolean;
  hasDates: boolean;
}) {
  const filled = completeness?.filledSlots ?? 0;
  const required = completeness?.requiredSlots ?? 0;
  const recipes = completeness?.recipesWithSteps ?? 0;
  const cooked = completeness?.cookedCount ?? 0;
  const planned = completeness?.plannedCount ?? 0;
  const mealsDone = required > 0 && filled >= required;
  const directionsDone = required > 0 && recipes >= required;
  const ready = Boolean(completeness?.readyToPublish);

  const items = [
    { label: "Employee", done: hasEmployee },
    { label: "Dates", done: hasDates },
    { label: `Meals ${filled}/${required || 0}`, done: mealsDone },
    { label: `Directions ${recipes}/${Math.max(filled, required)}`, done: directionsDone },
    { label: "Ready to publish", done: ready },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Plan progress</p>
          <p className="text-xs text-slate-500">
            {planned > 0 ? `${cooked}/${planned} cooked by the employee` : "Fill breakfast, lunch, and dinner, then add how to cook each meal."}
          </p>
        </div>
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${required === 0 ? 0 : Math.min(100, Math.round(((filled + recipes) / (required * 2)) * 100))}%`,
            }}
          />
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-5">
        {items.map((item, index) => (
          <li
            key={item.label}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
              item.done
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                item.done ? "bg-emerald-600 text-white" : "bg-white text-slate-400"
              }`}
            >
              {item.done ? "✓" : index + 1}
            </span>
            {item.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { STEPS };
