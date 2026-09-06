"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";
import { Field, Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/ui/Table";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatNaira } from "@/lib/format";
import type { OrderFulfillmentStatus } from "@/lib/types";

interface OpsOrder {
  id: string;
  employeeId: string;
  employerId: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  creditStatus: string;
  totalKobo: number;
  subtotalKobo: number;
  reservedKobo: number | null;
  reservationStatus: string | null;
  approvedAmountKobo: number | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    fulfilledQuantity: number;
    lineTotalKobo: number;
  }>;
  createdAt: string;
}

const ATTENTION_STATUSES: OrderFulfillmentStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "READY_FOR_PICKUP",
];

export default function OrdersAttentionPage() {
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = status ? `?status=${status}` : "";
      const data = await api.get<OpsOrder[]>(`/employer/orders${qs}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    if (status) return orders;
    return orders.filter((o) => ATTENTION_STATUSES.includes(o.fulfillmentStatus));
  }, [orders, status]);

  async function transition(orderId: string, next: OrderFulfillmentStatus) {
    setBusyId(orderId);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/employer/orders/${orderId}/transition`, { status: next });
      setSuccess(`Order advanced to ${next.replaceAll("_", " ")}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Transition failed.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<OpsOrder>[] = [
    {
      header: "Order",
      accessor: (order) => (
        <div>
          <Link
            href={`/employees/${order.employeeId}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ") ||
              order.id.slice(0, 8)}
          </Link>
          <p className="text-xs text-slate-400">{formatDateTime(order.createdAt)}</p>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: (order) => formatNaira(order.totalKobo),
    },
    {
      header: "Reserved",
      accessor: (order) =>
        order.reservedKobo != null ? formatNaira(order.reservedKobo) : "—",
    },
    {
      header: "Fulfillment",
      accessor: (order) => <Badge>{order.fulfillmentStatus}</Badge>,
    },
    {
      header: "Credit",
      accessor: (order) => <Badge tone="info">{order.creditStatus}</Badge>,
    },
    {
      header: "Actions",
      accessor: (order) => {
        const next =
          order.fulfillmentStatus === "APPROVED"
            ? "PROCESSING"
            : order.fulfillmentStatus === "PROCESSING"
              ? "OUT_FOR_DELIVERY"
              : order.fulfillmentStatus === "OUT_FOR_DELIVERY"
                ? "READY_FOR_PICKUP"
                : order.fulfillmentStatus === "READY_FOR_PICKUP"
                  ? "FULFILLED"
                  : null;
        return next ? (
          <Button
            className="px-2 py-1 text-xs"
            loading={busyId === order.id}
            onClick={() => void transition(order.id, next)}
          >
            → {next.replaceAll("_", " ")}
          </Button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide orders needing operational attention, with credit context.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <Card>
        <CardHeader title="Filter" />
        <CardBody className="flex flex-wrap items-end gap-3">
          <Field label="Status" className="min-w-[220px]">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Needs attention (default)</option>
              {ATTENTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
              <option value="FULFILLED">FULFILLED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </CardBody>
      </Card>

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : (
        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={columns}
              rows={visible}
              keyFor={(order) => order.id}
              emptyMessage="No orders match this filter."
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
