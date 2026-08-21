"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AiProviderChoice, MealPlanDay, MealPlanDetail } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { CompletenessBar } from "@/components/meal-plans/CompletenessBar";
import { AiProviderMenu } from "@/components/meal-plans/AiProviderMenu";
import { SlotEditor } from "@/components/meal-plans/SlotEditor";
import { slotItem, WeekGrid } from "@/components/meal-plans/WeekGrid";

export default function MealPlanBuilderPage() {
  const params = useParams<{ id: string }>();
  const [plan, setPlan] = useState<MealPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provider, setProvider] = useState<AiProviderChoice>("auto");
  const [weekStart, setWeekStart] = useState(0);
  const [selected, setSelected] = useState<{ dayId: string; slot: string } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MealPlanDetail>(`/admin/meal-plans/${params.id}`);
      setPlan(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meal plan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  const selectedDay = useMemo(() => {
    if (!plan || !selected) return null;
    return plan.days.find((day) => day.id === selected.dayId) ?? null;
  }, [plan, selected]);

  const selectedItem = selectedDay && selected ? slotItem(selectedDay, selected.slot) : undefined;
  const editable = plan?.status === "DRAFT" || plan?.status === "PENDING_REVIEW";

  function selectSlot(day: MealPlanDay, slot: string) {
    setSelected({ dayId: day.id, slot });
  }

  async function generateWeek(replaceExisting: boolean) {
    if (!plan) return;
    if (
      replaceExisting &&
      !window.confirm("Replace meals that are already on the calendar?")
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.post<MealPlanDetail>(`/admin/meal-plans/${plan.id}/ai/generate`, {
        provider,
        replaceExisting,
      });
      setPlan(updated);
      setSuccess("AI filled the week. Review meals and directions before publishing.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "AI could not generate this plan.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.post<MealPlanDetail>(`/admin/meal-plans/${plan.id}/publish`, {});
      setPlan(updated);
      setSuccess("Published. The employee can now cook from this plan.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not publish this plan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading meal plan…" />
      </div>
    );
  }

  if (!plan) {
    return <ErrorBanner message={error ?? "Meal plan not found."} />;
  }

  const missing = plan.completeness.missing.slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/meal-plans" className="text-sm text-indigo-600 hover:underline">
            ← Back to queue
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{plan.title}</h1>
            <Badge>{plan.status}</Badge>
            <Badge tone="info">{plan.source}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {plan.employeeName} · {plan.employerName}
            {plan.startsOn && plan.endsOn ? ` · ${plan.startsOn} to ${plan.endsOn}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AiProviderMenu value={provider} onChange={setProvider} />
          {editable ? (
            <>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => void generateWeek(false)}
              >
                Use AI for empty slots
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => void generateWeek(true)}
              >
                Use AI for this week
              </Button>
              <Button
                loading={busy}
                disabled={!plan.completeness.readyToPublish}
                title={
                  plan.completeness.readyToPublish
                    ? "Publish this plan"
                    : missing.map((gap) => `${gap.mealSlot}: ${gap.reason.replaceAll("_", " ")}`).join(", ")
                }
                onClick={() => void publish()}
              >
                Publish
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <CompletenessBar
        completeness={plan.completeness}
        hasEmployee
        hasDates={Boolean(plan.startsOn)}
      />

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_minmax(320px,380px)]">
        <Card>
          <CardHeader title="Employee goals" />
          <CardBody>
            {plan.profile ? (
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  {plan.profile.age} yrs · {plan.profile.gender.toLowerCase()} · {plan.profile.heightCm} cm · {plan.profile.weightKg} kg
                </p>
                <p>Lifestyle: {plan.profile.lifestyle.replaceAll("_", " ")}</p>
                <p>Activity: {plan.profile.activityLevel.replaceAll("_", " ")}</p>
                {plan.profile.targetEnergyKcal ? (
                  <p>Target: {plan.profile.targetEnergyKcal} kcal</p>
                ) : null}
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Allergies
                </p>
                <p>{plan.profile.allergies.join(", ") || "None listed"}</p>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Goals
                </p>
                <div className="flex flex-wrap gap-1">
                  {plan.profile.goals.map((goal) => (
                    <span key={goal} className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No health profile on file.</p>
            )}
            {missing.length > 0 ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">Still open</p>
                <ul className="mt-1 list-disc pl-4">
                  {missing.map((gap) => (
                    <li key={`${gap.dayId}-${gap.mealSlot}-${gap.reason}`}>
                      {gap.planDate ?? "Day"} · {gap.mealSlot} · {gap.reason.replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Week calendar"
            subtitle="Breakfast, lunch, and dinner are required. Snack is optional."
          />
          <CardBody>
            {plan.days.length > 7 ? (
              <div className="mb-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  disabled={weekStart === 0}
                  onClick={() => setWeekStart(Math.max(0, weekStart - 7))}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  disabled={weekStart + 7 >= plan.days.length}
                  onClick={() => setWeekStart(weekStart + 7)}
                >
                  Next
                </Button>
              </div>
            ) : null}
            <WeekGrid
              days={plan.days}
              weekStartIndex={weekStart}
              selected={selected}
              onSelect={selectSlot}
            />
          </CardBody>
        </Card>

        {selected && selectedDay ? (
          <div className="min-h-160 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SlotEditor
              plan={plan}
              dayId={selected.dayId}
              slot={selected.slot}
              item={selectedItem}
              provider={provider}
              onProviderChange={setProvider}
              onClose={() => setSelected(null)}
              onSaved={(updated) => {
                setPlan(updated);
                setSuccess("Meal saved.");
              }}
              onError={setError}
            />
          </div>
        ) : (
          <Card>
            <CardHeader title="Meal editor" />
            <CardBody>
              <p className="text-sm text-slate-500">
                Click an empty slot to add food from the catalog, then write cooking directions.
                Use AI for a full week or for one meal at a time.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
