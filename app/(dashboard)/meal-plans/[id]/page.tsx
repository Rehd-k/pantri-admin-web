"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MealPlanDetail } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

export default function MealPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MealPlanDetail>(`/admin/meal-plans/${params.id}`);
      setPlan(data);
      setAdminNote(data.adminNote ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meal plan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDecision(decision: "approve" | "reject") {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.post<MealPlanDetail>(`/admin/meal-plans/${params.id}/${decision}`, {
        adminNote: adminNote.trim() || undefined,
      });
      setPlan(updated);
      setSuccess(
        decision === "approve"
          ? "Approved. A private AI pantry package was created for the employee."
          : "Meal plan rejected.",
      );
      if (decision === "approve") {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/meal-plans" className="text-sm text-indigo-600 hover:underline">
            ← Back to queue
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{plan.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {plan.employeeName} · {plan.employerName} · {formatDateTime(plan.createdAt)}
          </p>
        </div>
        <Badge>{plan.status}</Badge>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      {plan.profile ? (
        <Card>
          <CardHeader title="Health profile snapshot" />
          <CardBody>
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <p>Age: {plan.profile.age}</p>
              <p>Gender: {plan.profile.gender}</p>
              <p>Height: {plan.profile.heightCm} cm</p>
              <p>Weight: {plan.profile.weightKg} kg</p>
              <p>Lifestyle: {plan.profile.lifestyle}</p>
              <p>Activity: {plan.profile.activityLevel}</p>
              <p className="md:col-span-3">Allergies: {plan.profile.allergies.join(", ") || "None"}</p>
              <p className="md:col-span-3">Goals: {plan.profile.goals.join(", ") || "None"}</p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {plan.days.map((day) => (
        <Card key={day.id}>
          <CardHeader title={day.label || `Day ${day.dayIndex}`} />
          <CardBody>
            <div className="space-y-3">
              {day.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <Badge tone={item.matchType === "PRIMARY" ? "success" : "warning"}>
                      {item.matchType}
                    </Badge>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{item.mealSlot}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.productName
                      ? `Catalog: ${item.productName} × ${item.quantity}`
                      : `Requested: ${item.requestedProductName || "—"} (unmatched)`}
                  </p>
                  {item.rationale ? (
                    <p className="mt-1 text-sm text-slate-500">{item.rationale}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {plan.status === "PENDING_REVIEW" ? (
        <Card>
          <CardHeader title="Admin decision" subtitle="Approval creates a private pantry package." />
          <CardBody className="space-y-4">
            <Field label="Note (optional)">
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Feedback for internal records"
              />
            </Field>
            <div className="flex gap-3">
              <Button loading={busy} onClick={() => handleDecision("approve")}>
                Approve & create package
              </Button>
              <Button variant="danger" loading={busy} onClick={() => handleDecision("reject")}>
                Reject
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Decision" />
          <CardBody className="space-y-2 text-sm text-slate-700">
            {plan.adminNote ? <p>Note: {plan.adminNote}</p> : <p>No admin note.</p>}
            {plan.packageId ? <p>Package ID: {plan.packageId}</p> : null}
            {plan.reviewedAt ? <p>Reviewed: {formatDateTime(plan.reviewedAt)}</p> : null}
            {plan.failureReason ? <p className="text-red-600">Failure: {plan.failureReason}</p> : null}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
