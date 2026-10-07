"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { CatalogImage } from "@/components/cms/catalog-ui";
import { Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/Table";
import { formatNaira } from "@/lib/format";
import type { MarketplaceProduct } from "@/lib/types";

function StatusBadges({ product }: { product: MarketplaceProduct }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge tone={product.isActive ? "success" : "neutral"}>
        {product.isActive ? "ACTIVE" : "INACTIVE"}
      </Badge>
      {product.isVerified ? <Badge tone="info">VERIFIED</Badge> : null}
      {product.discountPercent > 0 ? (
        <Badge tone="warning">{`${product.discountPercent}% OFF`}</Badge>
      ) : null}
    </div>
  );
}

function ProductMeta({ product }: { product: MarketplaceProduct }) {
  const packCount = product.packs.length;
  return (
    <p className="text-xs text-slate-500">
      {product.categoryName} / {product.subcategoryName}
      {" · "}
      {packCount} pack{packCount === 1 ? "" : "s"}
      {product.origin ? ` · ${product.origin}` : ""}
    </p>
  );
}

function DeleteProductButton({
  product,
  onDeleted,
}: {
  product: MarketplaceProduct;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/admin/marketplace/products/${product.id}`);
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        Delete
      </button>
      <Dialog
        open={open}
        title={`Delete ${product.name}?`}
        description="This removes the product and its packs. Products used in a package or recipe cannot be deleted."
        confirmLabel="Delete product"
        confirmVariant="danger"
        loading={loading}
        onConfirm={() => void confirm()}
        onClose={() => setOpen(false)}
      >
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </Dialog>
    </>
  );
}

export function ProductCard({
  product,
  compact = false,
  onDeleted,
}: {
  product: MarketplaceProduct;
  compact?: boolean;
  onDeleted: () => void;
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <Link
        href={`/marketplace/products/${product.id}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className={`relative bg-slate-50 ${compact ? "aspect-square" : "h-44"}`}>
          <CatalogImage src={product.imageUrl} alt={product.name} className="h-full w-full" />
          <div className="absolute left-2 top-2">
            <StatusBadges product={product} />
          </div>
        </div>
        <div className={`flex flex-1 flex-col gap-1 ${compact ? "p-3" : "p-4"}`}>
          <p className={`font-medium text-slate-900 group-hover:text-indigo-700 ${compact ? "line-clamp-2 text-sm" : "text-base"}`}>
            {product.name}
          </p>
          {!compact ? <ProductMeta product={product} /> : (
            <p className="line-clamp-1 text-xs text-slate-500">{product.categoryName}</p>
          )}
          <div className="mt-auto flex items-end justify-between pt-2">
            <div>
              <p className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>
                {formatNaira(product.fromPriceKobo)}
              </p>
              {product.fromRetailPriceKobo > product.fromPriceKobo ? (
                <p className="text-xs text-slate-400 line-through">
                  {formatNaira(product.fromRetailPriceKobo)}
                </p>
              ) : null}
            </div>
            {product.reviewCount > 0 ? (
              <p className="text-xs text-slate-500">
                {product.averageRating.toFixed(1)} ★
              </p>
            ) : (
              <span className="text-xs font-medium text-indigo-600">Edit</span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex justify-end border-t border-slate-100 px-2 py-1">
        <DeleteProductButton product={product} onDeleted={onDeleted} />
      </div>
    </div>
  );
}

export function ProductCards({
  products,
  compact = false,
  onDeleted,
}: {
  products: MarketplaceProduct[];
  compact?: boolean;
  onDeleted: () => void;
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact onDeleted={onDeleted} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onDeleted={onDeleted} />
      ))}
    </div>
  );
}

export function productTableColumns(onDeleted: () => void): Column<MarketplaceProduct>[] {
  return [
    {
      id: "image",
      header: "",
      accessor: (row) => (
        <CatalogImage src={row.imageUrl} alt={row.name} className="h-10 w-10 rounded-lg" />
      ),
    },
    {
      id: "product",
      header: "Product",
      accessor: (row) => (
        <div>
          <Link href={`/marketplace/products/${row.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
            {row.name}
          </Link>
          <ProductMeta product={row} />
        </div>
      ),
    },
    {
      id: "price",
      header: "From",
      accessor: (row) => (
        <div>
          <p className="font-medium">{formatNaira(row.fromPriceKobo)}</p>
          {row.fromRetailPriceKobo > row.fromPriceKobo ? (
            <p className="text-xs text-slate-400 line-through">{formatNaira(row.fromRetailPriceKobo)}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => <StatusBadges product={row} />,
    },
    {
      id: "updated",
      header: "Updated",
      accessor: (row) => new Date(row.updatedAt).toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
    {
      id: "edit",
      header: "",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/marketplace/products/${row.id}`} className="px-2 text-sm font-medium text-indigo-600">
            Edit
          </Link>
          <DeleteProductButton product={row} onDeleted={onDeleted} />
        </div>
      ),
    },
  ];
}

export function ProductTable({
  products,
  onDeleted,
}: {
  products: MarketplaceProduct[];
  onDeleted: () => void;
}) {
  return (
    <DataTable
      columns={productTableColumns(onDeleted)}
      rows={products}
      keyFor={(row) => row.id}
      emptyMessage="No products match these filters."
    />
  );
}
