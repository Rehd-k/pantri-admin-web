import Link from "next/link";
import type { ReactNode } from "react";

const ROUTES = {
  employee: (id: string) => `/employees/${id}`,
  user: (id: string) => `/users/${id}`,
  employer: (id: string) => `/companies/${id}`,
  order: (id: string) => `/orders?orderId=${encodeURIComponent(id)}`,
  payroll: (id: string) => `/payroll/${id}`,
};

export function DrillLink({ type, id, children }: { type: keyof typeof ROUTES; id: string; children?: ReactNode }) {
  return <Link href={ROUTES[type](id)} className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline">{children ?? id.slice(0, 10)}</Link>;
}
