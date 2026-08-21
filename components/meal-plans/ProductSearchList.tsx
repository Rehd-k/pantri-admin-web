"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CatalogProductPick } from "@/lib/types";
import { Input } from "@/components/ui/Input";

export function ProductSearchList({
  selectedIds,
  onAdd,
}: {
  selectedIds: string[];
  onAdd: (product: CatalogProductPick) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CatalogProductPick[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  async function load(q: string) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("take", "16");
    const data = await api.get<CatalogProductPick[]>(
      `/admin/nutrition/catalog-products?${params.toString()}`,
    );
    setRows(data);
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search catalog products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {rows.map((product) => {
          const added = selectedIds.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              disabled={added}
              onClick={() => onAdd(product)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
            >
              <img
                src={product.imageUrl}
                alt=""
                className="h-9 w-9 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                <p className="text-xs text-slate-400">
                  {product.measureUnitLabel ?? "unit"}
                </p>
              </div>
              <span className="text-xs text-indigo-600">{added ? "Added" : "Add"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
