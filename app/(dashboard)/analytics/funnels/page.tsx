"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  SourceBadge,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { HowToUse } from "@/components/analytics/HowToUse";

function Inner() {
  const q = useAnalyticsQuery();
  const [stages, setStages] = useState<
    Array<{
      key: string;
      uniqueActors: number;
      conversionFromPrevious: number | null;
    }>
  >([]);
  const [notice, setNotice] = useState("");
  const [biggestDropOff, setBiggestDropOff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.get<{
          behavioralNotice: string;
          stages: typeof stages;
          biggestDropOff: string | null;
        }>(`/admin/analytics/funnels${q}`);
        setStages(data.stages);
        setNotice(data.behavioralNotice);
        setBiggestDropOff(data.biggestDropOff);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <p className="mb-4 text-sm text-amber-900">{notice}</p>
      <Card>
        <CardHeader title="Funnel" action={<SourceBadge source="behavioral" />} />
        <CardBody>
          <FunnelChart stages={stages} biggestDropOff={biggestDropOff} />
        </CardBody>
      </Card>
      <HowToUse tells="Where customers progress or leave the journey." watch="The highlighted largest stage-to-stage loss." actions="Inspect the preceding experience and compare conversion by employer or segment." />
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
