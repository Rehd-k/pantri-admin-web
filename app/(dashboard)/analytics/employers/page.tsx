"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import {
  AnalyticsNav,
  useAnalyticsQuery,
} from "@/components/analytics/AnalyticsNav";

type Row = {
  employerId: string;
  name: string;
  employeeCount: number;
  orderCount: number;
  revenueKobo: number;
  activeEmployees: number;
  exposureKobo: number;
  adoptionRate?: number;
  revenuePerEmployeeKobo?: number;
  peerBandNote?: string;
  vsPlatformAvg?: { adoption: number; revenuePerEmployeeKobo: number };
};

function Inner() {
  const q = useAnalyticsQuery();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.get<{ employers: Row[] }>(
          `/admin/analytics/employers${q}`,
        );
        setRows(data.employers);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed");
      }
    })();
  }, [q]);

  const columns: Column<Row>[] = [
    { id: "name", header: "Employer", accessor: (r) => <a className="font-medium text-emerald-700" href={`/companies/${r.employerId}`}>{r.name}</a> },
    { id: "emp", header: "Employees", accessor: (r) => String(r.employeeCount) },
    { id: "orders", header: "Orders", accessor: (r) => String(r.orderCount) },
    {
      id: "rev",
      header: "Revenue",
      accessor: (r) => formatNaira(r.revenueKobo),
    },
    { id: "peer", header: "Peer band", accessor: (r) => r.peerBandNote ?? "—" },
    { id: "adoption", header: "Adoption vs avg", accessor: (r) => r.vsPlatformAvg ? `${r.vsPlatformAvg.adoption >= 0 ? "+" : ""}${(r.vsPlatformAvg.adoption * 100).toFixed(1)}pp` : "—" },
    { id: "rpe", header: "Revenue/employee vs avg", accessor: (r) => r.vsPlatformAvg ? formatNaira(r.vsPlatformAvg.revenuePerEmployeeKobo) : "—" },
    {
      id: "active",
      header: "Active",
      accessor: (r) => String(r.activeEmployees),
    },
    {
      id: "exp",
      header: "Exposure",
      accessor: (r) => formatNaira(r.exposureKobo),
    },
  ];

  return (
    <AnalyticsNav>
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader title="Employer benchmark" subtitle="Business + behavioral active users" />
        <CardBody>
          <DataTable columns={columns} rows={rows} keyFor={(r) => r.employerId} />
        </CardBody>
      </Card>
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
