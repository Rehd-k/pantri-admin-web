"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { Field, Input, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/Table";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { AdminUserListItem, UserRole, UserStatus } from "@/lib/types";

const ROLE_OPTIONS: Array<UserRole | "ALL"> = [
  "ALL",
  "ADMIN",
  "EMPLOYER",
  "EMPLOYEE",
  "NUTRITIONIST",
  "SUPPLIER",
  "LOGISTICS",
];

const STATUS_OPTIONS: Array<UserStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "PENDING_APPROVAL",
  "SUSPENDED",
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (role !== "ALL") params.set("role", role);
      if (status !== "ALL") params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "200");
      const query = params.toString();
      setUsers(
        await api.get<AdminUserListItem[]>(
          `/admin/users${query ? `?${query}` : ""}`,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  const columns = useMemo<Column<AdminUserListItem>[]>(
    () => [
      {
        header: "Name",
        accessor: (row) => (
          <Link
            href={`/users/${row.id}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {row.firstName} {row.lastName}
          </Link>
        ),
      },
      {
        header: "Email",
        accessor: (row) => row.email,
      },
      {
        header: "Role",
        accessor: (row) => <Badge>{row.role}</Badge>,
      },
      {
        header: "Status",
        accessor: (row) => <Badge>{row.status}</Badge>,
      },
      {
        header: "Company / extra",
        accessor: (row) =>
          row.employerName ??
          row.businessName ??
          row.fleetName ??
          row.verificationStatus ??
          "—",
      },
      {
        header: "Joined",
        accessor: (row) => formatDateTime(row.createdAt),
      },
      {
        header: "",
        accessor: (row) => (
          <Link
            href={`/users/${row.id}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Open history →
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every account on the platform. Click a user to open their full history
          portal.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardHeader title="Filters" />
        <CardBody className="grid gap-4 md:grid-cols-4">
          <Field label="Search">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, email, business…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
            />
          </Field>
          <Field label="Role">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole | "ALL")}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All roles" : option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus | "ALL")}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All statuses" : option}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`${users.length} user${users.length === 1 ? "" : "s"}`}
          subtitle="Click any row to inspect orders, credit, verification, and activity"
        />
        <CardBody className="p-0">
          {loading ? (
            <div className="px-5 py-10">
              <Spinner label="Loading users…" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={users}
              keyFor={(row) => row.id}
              emptyMessage="No users match these filters."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
