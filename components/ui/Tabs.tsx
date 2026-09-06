"use client";

import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex flex-wrap gap-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-indigo-600 text-indigo-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function TabPanel({
  when,
  activeId,
  children,
}: {
  when: string;
  activeId: string;
  children: ReactNode;
}) {
  if (when !== activeId) return null;
  return <div className="pt-5">{children}</div>;
}
