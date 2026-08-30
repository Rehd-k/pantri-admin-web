"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/Feedback";

const ALL_NAV_ITEMS: {
  href: string;
  label: string;
  match?: string;
  roles?: Array<"ADMIN" | "NUTRITIONIST">;
}[] = [
  { href: "/", label: "Overview", roles: ["ADMIN"] },
  { href: "/users", label: "Users", match: "/users", roles: ["ADMIN"] },
  {
    href: "/marketplace/products",
    label: "Marketplace",
    match: "/marketplace",
    roles: ["ADMIN"],
  },
  { href: "/packages", label: "Packages", match: "/packages", roles: ["ADMIN"] },
  { href: "/companies", label: "Companies", match: "/companies", roles: ["ADMIN"] },
  {
    href: "/verification",
    label: "Verification",
    match: "/verification",
    roles: ["ADMIN"],
  },
  { href: "/delivery-settings", label: "Delivery", roles: ["ADMIN"] },
  { href: "/allergies", label: "Allergies", roles: ["ADMIN"] },
  { href: "/goals", label: "Goals", roles: ["ADMIN"] },
  {
    href: "/meal-plans",
    label: "Meal Plans",
    match: "/meal-plans",
    roles: ["ADMIN", "NUTRITIONIST"],
  },
  { href: "/settings", label: "Platform Settings", roles: ["ADMIN"] },
  { href: "/write-offs", label: "Write-Offs", roles: ["ADMIN"] },
  { href: "/reports", label: "Reports", roles: ["ADMIN"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    (item.roles ?? ["ADMIN"]).includes(
      (user?.role as "ADMIN" | "NUTRITIONIST") ?? "ADMIN",
    ),
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (
      !loading &&
      user?.role === "NUTRITIONIST" &&
      !pathname.startsWith("/meal-plans")
    ) {
      router.replace("/meal-plans");
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Loading Pantri Admin…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Redirecting to login…" />
      </div>
    );
  }

  const portalLabel =
    user.role === "NUTRITIONIST" ? "Nutritionist" : "Platform Admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              P
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Pantri</p>
              <p className="text-xs text-slate-400">{portalLabel}</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const prefix = item.match ?? item.href;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === prefix || pathname.startsWith(`${prefix}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <p className="truncate px-2 text-xs text-slate-400">{portalLabel}</p>
            <p className="truncate px-2 text-sm font-medium text-slate-700">
              {user.firstName} {user.lastName}
            </p>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                P
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Pantri {portalLabel}
              </span>
            </div>
            <button onClick={logout} className="text-sm font-medium text-slate-500">
              Sign out
            </button>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
            {navItems.map((item) => {
              const prefix = item.match ?? item.href;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === prefix || pathname.startsWith(`${prefix}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    active ? "bg-indigo-50 text-indigo-700" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-352">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
