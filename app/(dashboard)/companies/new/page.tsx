"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import type { CreatedCompany } from "@/lib/types";

export default function NewCompanyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [payrollDayOfMonth, setPayrollDayOfMonth] = useState("15");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCompany | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<CreatedCompany>("/admin/companies", {
        companyName,
        payrollDayOfMonth: Number(payrollDayOfMonth),
        firstName,
        lastName,
        email,
        password,
      });
      setCreated(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create company.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link href="/companies" className="text-sm text-indigo-600">
          ← Companies
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Add company</h1>
        <p className="mt-1 text-sm text-slate-500">
          Creates the company and an employer administrator who can sign in to the employer portal.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {created ? (
        <Card>
          <CardHeader title="Company created" subtitle={created.name} />
          <CardBody className="flex flex-col gap-3 text-sm text-slate-700">
            <SuccessBanner message="Share the password you set with the employer. It is not stored in a way you can view again." />
            <p>
              Invite code: <span className="font-mono font-medium">{created.inviteCode}</span>
            </p>
            <p>
              Employer login: {created.admin.firstName} {created.admin.lastName} · {created.admin.email}
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => router.push(`/companies/${created.id}`)}>Open company</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setCreated(null);
                  setCompanyName("");
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setPassword("");
                }}
              >
                Add another
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Company" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" className="sm:col-span-2">
                <Input
                  required
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Acme Foods"
                />
              </Field>
              <Field label="Payroll day" hint="Day of the month deductions run, from 1 to 28.">
                <Input
                  required
                  type="number"
                  min={1}
                  max={28}
                  value={payrollDayOfMonth}
                  onChange={(event) => setPayrollDayOfMonth(event.target.value)}
                />
              </Field>
            </CardBody>
            <CardHeader title="Employer administrator" subtitle="This person signs in on the employer portal." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input required value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              </Field>
              <Field label="Last name">
                <Input required value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </Field>
              <Field label="Work email" className="sm:col-span-2">
                <Input
                  required
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="Temporary password" hint="At least 8 characters." className="sm:col-span-2">
                <Input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" loading={submitting}>
                  Create company
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}
    </div>
  );
}
