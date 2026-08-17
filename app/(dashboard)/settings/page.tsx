"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { PlatformSettings, UpdatePlatformSettingsInput } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [form, setForm] = useState<UpdatePlatformSettingsInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<PlatformSettings>("/admin/platform-settings");
        if (!cancelled) {
          setSettings(data);
          setForm(data);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load platform settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<PlatformSettings>("/admin/platform-settings", form);
      setSettings(updated);
      setForm(updated);
      setSuccess("Platform settings updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner label="Loading platform settings…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide guardrails that cap what any employer&apos;s credit policy may configure.
          {settings ? ` Last updated ${formatDateTime(settings.updatedAt)}.` : ""}
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Global caps" subtitle="Applied above every employer's own credit policy" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Max interest APR (bps)" hint="2400 = 24% annual ceiling for all employers">
              <Input
                type="number"
                min={0}
                max={10000}
                value={form.maxInterestAnnualRateBps ?? 0}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, maxInterestAnnualRateBps: Number(e.target.value) }))
                }
              />
            </Field>
            <Field label="Penalties enabled globally" hint="Kill switch for late-payment penalties platform-wide">
              <Select
                value={form.penaltiesEnabledGlobal ? "true" : "false"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, penaltiesEnabledGlobal: e.target.value === "true" }))
                }
              >
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" loading={saving}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
