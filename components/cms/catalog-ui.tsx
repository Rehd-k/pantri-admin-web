"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  CATALOG_PAGE_SIZES,
  pageWindow,
  persistCatalogView,
  readStoredCatalogView,
  type CatalogView,
} from "@/lib/catalog";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function useCatalogView(): [CatalogView, (view: CatalogView) => void] {
  const [view, setView] = useState<CatalogView>("cards");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setView(readStoredCatalogView());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistCatalogView(view);
  }, [view, ready]);

  return [view, setView];
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: CatalogView;
  onChange: (view: CatalogView) => void;
}) {
  const options: Array<{ id: CatalogView; label: string; icon: string }> = [
    { id: "table", label: "Table", icon: "☰" },
    { id: "cards", label: "Cards", icon: "▦" },
    { id: "grid", label: "Grid", icon: "⊞" },
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Display mode">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            aria-pressed={active}
            title={option.label}
          >
            <span className="mr-1.5 hidden sm:inline">{option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm10.5 3-5.2-5.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

export function PaginationBar({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
}) {
  const pages = pageWindow(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {total === 0 ? "No results" : (
          <>
            Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{" "}
            <span className="font-medium text-slate-700">{total}</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Per page
          <Select
            value={String(pageSize)}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="py-1"
          >
            {CATALOG_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1.5"
          >
            Prev
          </Button>
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`e-${index}`} className="px-1 text-sm text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(item)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
                  item === page
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ),
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1.5"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CatalogProgress({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-indigo-100">
      <div className="h-full w-1/3 catalog-progress-bar bg-indigo-600" />
    </div>
  );
}

export function CatalogEmpty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-16 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint ? <p className="max-w-md text-sm text-slate-500">{hint}</p> : null}
      {action}
    </div>
  );
}

export function CatalogImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`object-cover ${className}`} />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400 ${className}`}>
      {(alt.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />
          {Array.from({ length: cols }, (_, j) => (
            <SkeletonBlock key={j} className={`h-3 ${j === 0 ? "w-48" : "w-20"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-100">
          <SkeletonBlock className="h-40 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-100">
          <SkeletonBlock className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <SkeletonBlock className="h-3 w-4/5" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogSkeleton({ view }: { view: CatalogView }) {
  if (view === "table") return <TableSkeleton />;
  if (view === "grid") return <GridSkeleton />;
  return <CardsSkeleton />;
}
