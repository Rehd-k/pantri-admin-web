"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { AnalyticsNav, SourceBadge } from "@/components/analytics/AnalyticsNav";

type Metric = {
  id: string;
  name: string;
  source: string;
  formula: string;
};

function Inner() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [learning, setLearning] = useState<
    Array<{ id: string; title: string; body: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.get<{
          metrics: Metric[];
          learningCenter: Array<{ id: string; title: string; body: string }>;
        }>("/admin/analytics/definitions");
        setMetrics(data.metrics);
        setLearning(data.learningCenter);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, []);

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Analytics learning center</h2>
        <p className="mt-1 text-sm text-slate-500">Understand how Pantri measures performance before making decisions.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Metric definitions" />
          <CardBody className="space-y-4">
            {metrics.length === 0 && <p className="text-sm text-slate-500">No metric definitions are available.</p>}
            {metrics.map((m) => (
              <div key={m.id} className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{m.name}</h3>
                  <SourceBadge
                    source={m.source === "business" ? "business" : "behavioral"}
                  />
                </div>
                <p className="mt-1 text-sm text-slate-600">{m.formula}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Learning center" />
          <CardBody className="space-y-4">
            {learning.length === 0 && <p className="text-sm text-slate-500">No learning articles are available.</p>}
            {learning.map((item) => (
              <div key={item.id}>
                <h3 className="font-medium text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </AnalyticsNav>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <Inner />
    </Suspense>
  );
}
