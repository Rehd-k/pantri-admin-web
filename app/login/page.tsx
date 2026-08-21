"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

const DEMO_NUTRITIONIST = {
  email: "nutritionist@pantri.app",
  password: "Nutrition123!",
};

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"form" | "nutritionist" | null>(
    null,
  );

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "NUTRITIONIST" ? "/meal-plans" : "/");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting("form");
    try {
      await login(email, password);
    } catch (err) {
      setError(authErrorMessage(err, "Unable to sign in. Please try again."));
    } finally {
      setSubmitting(null);
    }
  }

  async function loadNutritionistAccount() {
    setError(null);
    setEmail(DEMO_NUTRITIONIST.email);
    setPassword(DEMO_NUTRITIONIST.password);
    setSubmitting("nutritionist");
    try {
      await login(DEMO_NUTRITIONIST.email, DEMO_NUTRITIONIST.password);
    } catch (err) {
      setError(
        authErrorMessage(
          err,
          "Could not load the nutritionist account. Seed the database and try again.",
        ),
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label={user ? "Redirecting…" : "Checking session…"} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            P
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Pantri Platform Admin</h1>
          <p className="text-sm text-slate-500">
            Admins operate the platform. Nutritionists review and activate meal plans.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error ? <ErrorBanner message={error} /> : null}
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pantri.co"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button
            type="submit"
            loading={submitting === "form"}
            disabled={submitting !== null}
            className="mt-2 w-full"
          >
            Sign in
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={submitting === "nutritionist"}
            disabled={submitting !== null}
            className="w-full"
            onClick={() => void loadNutritionistAccount()}
          >
            Load nutritionist account
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-400">
          Admin and nutritionist accounts. Meal-plan review opens automatically
          for nutritionists.
        </p>
      </div>
    </div>
  );
}
