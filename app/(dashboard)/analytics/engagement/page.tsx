"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

function Inner() {
  const q = useAnalyticsQuery();
  const [data, setData] = useState<{
    dau: number;
    wau: number;
    mau: number;
    sessions: number;
    avgSessionDurationMs: number;
    behavioralNotice: string;
    stickiness: number | null;
    dormantCount: number;
    reactivatedCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await api.get(`/admin/analytics/users/engagement${q}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      {data && (
        <div className="space-y-4">
          <p className="text-sm text-amber-900">{data.behavioralNotice}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="DAU" value={String(data.dau)} />
            <StatCard label="WAU" value={String(data.wau)} />
            <StatCard label="MAU" value={String(data.mau)} />
            <StatCard label="Sessions" value={String(data.sessions)} />
            <StatCard
              label="Avg session"
              value={`${Math.round(data.avgSessionDurationMs / 1000)}s`}
            />
            <StatCard label="DAU / MAU stickiness" value={data.stickiness == null ? "—" : `${(data.stickiness * 100).toFixed(1)}%`} />
            <StatCard label="Dormant customers" value={String(data.dormantCount ?? 0)} tone="danger" />
            <StatCard label="Reactivated customers" value={String(data.reactivatedCount ?? 0)} tone="success" />
          </div>
        </div>
      )}
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
