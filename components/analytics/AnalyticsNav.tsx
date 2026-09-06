"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";

const FILTERS = ["from", "to", "compare", "employerId", "segmentKey", "categoryId"] as const;
const HUBS = [
  { label: "Overview", links: [{ href: "/analytics", label: "Overview" }] },
  { label: "Customers", links: [
    { href: "/analytics/engagement", label: "Engagement" },
    { href: "/analytics/segments", label: "Segments" },
  ] },
  { label: "Commerce", links: [
    { href: "/analytics/products", label: "Products" },
    { href: "/analytics/search", label: "Search" },
    { href: "/analytics/cart", label: "Cart" },
    { href: "/analytics/funnels", label: "Funnels" },
    { href: "/analytics/seasonality", label: "Seasonality" },
    { href: "/analytics/revenue", label: "Revenue" },
  ] },
  { label: "Credit", links: [{ href: "/analytics/credit", label: "Credit" }] },
  { label: "Employers", links: [{ href: "/analytics/employers", label: "Employers" }] },
  { label: "Intelligence", links: [{ href: "/analytics/intelligence", label: "Intelligence" }] },
  { label: "Explorer", links: [{ href: "/analytics/explorer", label: "Explorer" }] },
  { label: "Export", links: [{ href: "/analytics/export", label: "Export" }] },
  { label: "Learning", links: [{ href: "/analytics/definitions", label: "Learning" }] },
];

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function presetRange(days: number | "month" | "quarter") {
  const to = new Date();
  const from = new Date(to);
  if (typeof days === "number") from.setDate(from.getDate() - days + 1);
  else if (days === "month") from.setDate(1);
  else from.setMonth(Math.floor(from.getMonth() / 3) * 3, 1);
  return [iso(from), iso(to)] as const;
}

export function AnalyticsNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const query = useMemo(() => {
    const q = new URLSearchParams();
    FILTERS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) q.set(key, value);
    });
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [searchParams]);

  function update(values: Record<string, string>) {
    const q = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => value ? q.set(key, value) : q.delete(key));
    router.push(`${pathname}${q.size ? `?${q}` : ""}`);
  }

  const chips = FILTERS.flatMap((key) => {
    const value = searchParams.get(key);
    return value ? [{ key, value }] : [];
  });

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 -mt-6 mb-6 border-b border-slate-200 bg-slate-50/95 px-4 pb-4 pt-6 backdrop-blur md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              Business facts from Pantri data · behavioral events after collection start
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              From
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
                value={from.slice(0, 10)}
                onChange={(e) => update({ from: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              To
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700"
                value={to.slice(0, 10)}
                onChange={(e) => update({ to: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Compare
              <select className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700" value={searchParams.get("compare") ?? "previous_period"} onChange={(e) => update({ compare: e.target.value })}>
                <option value="previous_period">Previous period</option>
                <option value="previous_year">Previous year</option>
                <option value="none">No comparison</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Employer ID
              <input className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700" placeholder="All employers" value={searchParams.get("employerId") ?? ""} onChange={(e) => update({ employerId: e.target.value })} />
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {([["Last 7d", 7], ["30d", 30], ["90d", 90], ["This month", "month"], ["This quarter", "quarter"]] as const).map(([label, preset]) => (
            <button key={label} type="button" onClick={() => { const [nextFrom, nextTo] = presetRange(preset); update({ from: nextFrom, to: nextTo }); }} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-emerald-300 hover:text-emerald-700">{label}</button>
          ))}
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map(({ key, value }) => (
              <button key={key} type="button" onClick={() => update({ [key]: "" })} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                {key}: {value} ×
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const q = new URLSearchParams(searchParams.toString());
                FILTERS.forEach((key) => q.delete(key));
                router.push(`${pathname}${q.size ? `?${q}` : ""}`);
              }}
              className="text-xs font-medium text-slate-500 underline"
            >
              Reset
            </button>
          </div>
        )}
        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          {HUBS.map((hub) => (
            <div key={hub.label}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {hub.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {hub.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/analytics" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={`${link.href}${query}`}
                      className={`rounded-lg px-2.5 py-1.5 text-sm ${
                        active
                          ? "bg-emerald-700 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}

export function useAnalyticsQuery(): string {
  const searchParams = useSearchParams();
  const q = new URLSearchParams();
  FILTERS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) q.set(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function SourceBadge({ source }: { source: "business" | "behavioral" }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
        source === "business"
          ? "bg-sky-50 text-sky-700"
          : "bg-violet-50 text-violet-700"
      }`}
    >
      {source}
    </span>
  );
}
