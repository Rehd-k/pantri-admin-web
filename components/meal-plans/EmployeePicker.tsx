"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { NutritionEmployee } from "@/lib/types";
import { Input } from "@/components/ui/Input";

export function EmployeePicker({
  value,
  onSelect,
}: {
  value: NutritionEmployee | null;
  onSelect: (employee: NutritionEmployee) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<NutritionEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  async function load(q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("take", "20");
      const data = await api.get<NutritionEmployee[]>(
        `/admin/nutrition/employees?${params.toString()}`,
      );
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name, email, or company"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading ? (
        <p className="text-xs text-slate-400">Searching…</p>
      ) : null}
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {rows.map((row) => {
          const selected = value?.employeeId === row.employeeId;
          return (
            <button
              key={row.employeeId}
              type="button"
              onClick={() => onSelect(row)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              }`}
            >
              <p className="font-medium text-slate-900">
                {row.firstName} {row.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {row.employerName} · {row.email}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {row.profile?.goals.join(", ") || "Goals not listed"}
              </p>
            </button>
          );
        })}
        {!loading && rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No employees waiting for a plan. Try a broader search or create from an existing draft.
          </p>
        ) : null}
      </div>
    </div>
  );
}
