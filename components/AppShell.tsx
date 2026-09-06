"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/Feedback";

type Role = "ADMIN" | "NUTRITIONIST";
type IconName =
  | "home"
  | "chart"
  | "users"
  | "orders"
  | "companies"
  | "shield"
  | "payroll"
  | "store"
  | "package"
  | "blog"
  | "allergies"
  | "goals"
  | "meals"
  | "writeOffs"
  | "reports"
  | "truck"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match?: string;
  roles?: Role[];
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Overview", icon: "home", roles: ["ADMIN"] },
      {
        href: "/analytics",
        label: "Analytics",
        icon: "chart",
        match: "/analytics",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/users", label: "Users", icon: "users", match: "/users", roles: ["ADMIN"] },
      { href: "/orders", label: "Orders", icon: "orders", match: "/orders", roles: ["ADMIN"] },
      {
        href: "/companies",
        label: "Companies",
        icon: "companies",
        match: "/companies",
        roles: ["ADMIN"],
      },
      {
        href: "/verification",
        label: "Verification",
        icon: "shield",
        match: "/verification",
        roles: ["ADMIN"],
      },
      { href: "/payroll", label: "Payroll", icon: "payroll", match: "/payroll", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/marketplace/products",
        label: "Marketplace",
        icon: "store",
        match: "/marketplace",
        roles: ["ADMIN"],
      },
      { href: "/packages", label: "Packages", icon: "package", match: "/packages", roles: ["ADMIN"] },
      { href: "/blog", label: "Blog", icon: "blog", match: "/blog", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Nutrition",
    items: [
      { href: "/allergies", label: "Allergies", icon: "allergies", roles: ["ADMIN"] },
      { href: "/goals", label: "Goals", icon: "goals", roles: ["ADMIN"] },
      {
        href: "/meal-plans",
        label: "Meal Plans",
        icon: "meals",
        match: "/meal-plans",
        roles: ["ADMIN", "NUTRITIONIST"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/write-offs", label: "Write-Offs", icon: "writeOffs", roles: ["ADMIN"] },
      { href: "/reports", label: "Reports", icon: "reports", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/delivery-settings", label: "Delivery", icon: "truck", roles: ["ADMIN"] },
      { href: "/settings", label: "Platform Settings", icon: "settings", roles: ["ADMIN"] },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  const prefix = item.match ?? item.href;
  return item.href === "/"
    ? pathname === "/"
    : pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function visibleGroups(role: Role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (item.roles ?? ["ADMIN"]).includes(role)),
  })).filter((group) => group.items.length > 0);
}

function sectionLabel(pathname: string, role: Role) {
  for (const group of visibleGroups(role)) {
    for (const item of group.items) {
      if (isActive(pathname, item)) return item.label;
    }
  }
  return role === "NUTRITIONIST" ? "Nutritionist" : "Platform Admin";
}

function Icon({ name }: { name: IconName }) {
  const props = {
    className: "h-4 w-4 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-4" />
          <path d="M12 15V8" />
          <path d="M16 15v-6" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "orders":
      return (
        <svg {...props}>
          <path d="M6 6h15l-1.5 9h-12z" />
          <path d="M6 6 5 3H2" />
          <circle cx="9" cy="20" r="1.25" />
          <circle cx="18" cy="20" r="1.25" />
        </svg>
      );
    case "companies":
      return (
        <svg {...props}>
          <path d="M4 21V7a1 1 0 0 1 1-1h6v15" />
          <path d="M11 21h9V4a1 1 0 0 0-1-1h-8" />
          <path d="M7 10h2M7 14h2M15 8h2M15 12h2M15 16h2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 3 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "payroll":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 15h2" />
        </svg>
      );
    case "store":
      return (
        <svg {...props}>
          <path d="M4 10V21h16V10" />
          <path d="M3 7h18l-1-4H4z" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );
    case "package":
      return (
        <svg {...props}>
          <path d="m12 3 8 4.5v9L12 21 4 16.5v-9z" />
          <path d="M12 12 4 7.5" />
          <path d="M12 12v9" />
          <path d="m12 12 8-4.5" />
        </svg>
      );
    case "blog":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "allergies":
      return (
        <svg {...props}>
          <path d="M12 3c2 3 3 5 3 8a3 3 0 1 1-6 0c0-3 1-5 3-8z" />
          <path d="M8 18c.8-1.5 2.2-2 4-2s3.2.5 4 2" />
        </svg>
      );
    case "goals":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "meals":
      return (
        <svg {...props}>
          <path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M4 11 6 4h12l2 7" />
        </svg>
      );
    case "writeOffs":
      return (
        <svg {...props}>
          <path d="M12 3v12" />
          <path d="m8 11 4 4 4-4" />
          <path d="M5 19h14" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <path d="M8 6h8M8 10h8M8 14h5" />
          <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        </svg>
      );
    case "truck":
      return (
        <svg {...props}>
          <path d="M3 7h11v10H3z" />
          <path d="M14 11h5l3 3v3h-8z" />
          <circle cx="7" cy="18" r="1.5" />
          <circle cx="18" cy="18" r="1.5" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.2 1.8 1.2H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
  }
}

function NavList({
  groups,
  pathname,
  onNavigate,
}: {
  groups: { label: string; items: NavItem[] }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-6 px-3 py-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Brand({ portalLabel }: { portalLabel: string }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        P
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">Pantri</p>
        <p className="text-xs text-slate-400">{portalLabel}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50">
        <Spinner label="Loading Pantri Admin…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-50">
        <Spinner label="Redirecting to login…" />
      </div>
    );
  }

  const role = (user.role as Role) ?? "ADMIN";
  const portalLabel = role === "NUTRITIONIST" ? "Nutritionist" : "Platform Admin";
  const groups = visibleGroups(role);
  const current = sectionLabel(pathname, role);
  const displayName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="shrink-0 px-4 py-5">
          <Brand portalLabel={portalLabel} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList groups={groups} pathname={pathname} />
        </div>
        <div className="shrink-0 border-t border-slate-100 px-4 py-4">
          <p className="truncate px-2 text-xs text-slate-400">{portalLabel}</p>
          <p className="truncate px-2 text-sm font-medium text-slate-700">{displayName}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-dvh w-72 flex-col bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between px-4 py-5">
              <Brand portalLabel={portalLabel} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavList
                groups={groups}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="shrink-0 border-t border-slate-100 px-4 py-4">
              <p className="truncate px-2 text-sm font-medium text-slate-700">{displayName}</p>
              <button
                onClick={logout}
                className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{current}</p>
              <p className="hidden text-xs text-slate-400 sm:block">{portalLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden truncate text-sm text-slate-600 sm:block">{displayName}</p>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-352">{children}</div>
        </main>
      </div>
    </div>
  );
}
