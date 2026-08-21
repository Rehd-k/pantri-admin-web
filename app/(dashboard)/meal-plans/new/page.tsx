"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MealPlanDetail, NutritionEmployee } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";
import { CompletenessBar } from "@/components/meal-plans/CompletenessBar";
import { EmployeePicker } from "@/components/meal-plans/EmployeePicker";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMealPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<NutritionEmployee | null>(null);
  const [startsOn, setStartsOn] = useState(todayIso());
  const [dayCount, setDayCount] = useState(7);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const employeeId = searchParams.get("employeeId");
    if (!employeeId) return;
    void api
      .get<NutritionEmployee[]>(`/admin/nutrition/employees?take=100`)
      .then((rows) => {
        const match = rows.find((row) => row.employeeId === employeeId);
        if (match) setEmployee(match);
      })
      .catch(() => undefined);
  }, [searchParams]);

  async function create() {
    if (!employee) {
      setError("Pick an employee first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const plan = await api.post<MealPlanDetail>("/admin/meal-plans", {
        employeeId: employee.employeeId,
        startsOn,
        dayCount,
        title: title.trim() || undefined,
      });
      router.push(`/meal-plans/${plan.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the meal plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/meal-plans" className="text-sm text-indigo-600 hover:underline">
          ← Back to queue
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create meal plan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Start from the employee’s goals, pick a week, then fill meals from the catalog.
        </p>
      </div>

      <CompletenessBar
        hasEmployee={Boolean(employee)}
        hasDates={Boolean(startsOn) && dayCount > 0}
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="1. Choose employee" subtitle="Uses the questionnaire they already filled in." />
          <CardBody>
            <EmployeePicker value={employee} onSelect={setEmployee} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="2. Dates and title" />
          <CardBody>
            <div className="space-y-4">
              {employee ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p>{employee.employerName}</p>
                  <p className="mt-2">Goals: {employee.profile?.goals.join(", ") || "—"}</p>
                  <p>Allergies: {employee.profile?.allergies.join(", ") || "None"}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select someone on the left to see their profile.</p>
              )}
              <Field label="Plan title">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Week of balanced meals"
                />
              </Field>
              <Field label="Starts on">
                <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </Field>
              <Field label="Number of days" hint="Usually a 7-day week.">
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={dayCount}
                  onChange={(e) => setDayCount(Number(e.target.value) || 7)}
                />
              </Field>
              <Button loading={busy} onClick={() => void create()} disabled={!employee}>
                Open calendar builder
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
