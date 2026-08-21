"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CatalogImage } from "@/components/cms/catalog-ui";
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

export function ProductCard({
  product,
  compact = false,
}: {
  product: MarketplaceProduct;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/marketplace/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
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
  );
}

export function ProductCards({
  products,
  compact = false,
}: {
  products: MarketplaceProduct[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function productTableColumns(): Column<MarketplaceProduct>[] {
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
        <Link href={`/marketplace/products/${row.id}`} className="text-sm font-medium text-indigo-600">
          Edit
        </Link>
      ),
    },
  ];
}

export function ProductTable({ products }: { products: MarketplaceProduct[] }) {
  return (
    <DataTable
      columns={productTableColumns()}
      rows={products}
      keyFor={(row) => row.id}
      emptyMessage="No products match these filters."
    />
  );
}
