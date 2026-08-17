"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, koboToNairaInput, nairaToKobo } from "@/lib/format";
import type { DeliverySettings } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [freeMinNaira, setFreeMinNaira] = useState("");
  const [feeNaira, setFeeNaira] = useState("");
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
        const data = await api.get<DeliverySettings>("/admin/delivery-settings");
        if (!cancelled) {
          setSettings(data);
          setFreeMinNaira(koboToNairaInput(data.freeDeliveryMinKobo));
          setFeeNaira(koboToNairaInput(data.deliveryFeeKobo));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load delivery settings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const freeDeliveryMinKobo = nairaToKobo(freeMinNaira);
    const deliveryFeeKobo = nairaToKobo(feeNaira);
    if (freeDeliveryMinKobo === null || deliveryFeeKobo === null) {
      setError("Enter valid amounts in naira for both fields.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.patch<DeliverySettings>("/admin/delivery-settings", {
        freeDeliveryMinKobo,
        deliveryFeeKobo,
      });
      setSettings(updated);
      setFreeMinNaira(koboToNairaInput(updated.freeDeliveryMinKobo));
      setFeeNaira(koboToNairaInput(updated.deliveryFeeKobo));
      setSuccess("Delivery settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update delivery settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Spinner label="Loading delivery settings…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Delivery settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide delivery fee and free-delivery threshold.
          {settings ? ` Last updated ${formatDateTime(settings.updatedAt)}.` : ""}
        </p>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Fees" subtitle="Amounts are entered in naira and stored as kobo" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Free delivery minimum (₦)">
              <Input
                required
                inputMode="decimal"
                value={freeMinNaira}
                onChange={(e) => setFreeMinNaira(e.target.value)}
              />
            </Field>
            <Field label="Delivery fee (₦)">
              <Input
                required
                inputMode="decimal"
                value={feeNaira}
                onChange={(e) => setFeeNaira(e.target.value)}
              />
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
