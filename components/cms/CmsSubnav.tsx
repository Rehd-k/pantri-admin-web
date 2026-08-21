"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function CmsSubnav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const MARKETPLACE_NAV = [
  { href: "/marketplace/products", label: "Products" },
  { href: "/marketplace/categories", label: "Categories" },
  { href: "/marketplace/subcategories", label: "Subcategories" },
  { href: "/marketplace/banners", label: "Banners" },
  { href: "/marketplace/measures", label: "Units" },
];

export const PACKAGES_NAV = [
  { href: "/packages", label: "Packages" },
  { href: "/packages/tiers", label: "Discount tiers" },
];
