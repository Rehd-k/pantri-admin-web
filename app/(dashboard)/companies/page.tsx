"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { CompanyListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";

export default function CompaniesPage() {
  const [rows, setRows] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<CompanyListItem[]>("/admin/companies");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load companies.");
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

  const columns: Column<CompanyListItem>[] = [
    {
      header: "Company",
      accessor: (row) => (
        <Link href={`/companies/${row.id}`} className="font-medium text-indigo-600">
          {row.name}
        </Link>
      ),
    },
    { header: "Invite code", accessor: (row) => <span className="font-mono tracking-wide">{row.inviteCode}</span> },
    {
      header: "",
      accessor: (row) => (
        <Link
          href={`/companies/${row.id}/pickup-points`}
          className="text-sm font-medium text-indigo-600"
        >
          Pickup points
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a company and its employer login, then manage pickup hubs.
          </p>
        </div>
        <Link href="/companies/new">
          <Button>Add company</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        <CardHeader title="Companies" />
        <CardBody className="p-0">
          {loading ? (
            <Spinner label="Loading companies…" />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              keyFor={(row) => row.id}
              emptyMessage="No companies yet. Add one to create its employer login."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
