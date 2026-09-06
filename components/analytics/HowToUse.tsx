"use client";

import { useState } from "react";

export function HowToUse({ tells, watch, actions }: { tells: string; watch: string; actions: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800">
        How to use this analysis <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="grid gap-5 border-t border-slate-200 px-5 py-4 text-sm md:grid-cols-3">
        <div><h3 className="font-medium text-slate-900">What this tells you</h3><p className="mt-1 leading-6 text-slate-600">{tells}</p></div>
        <div><h3 className="font-medium text-slate-900">What to watch</h3><p className="mt-1 leading-6 text-slate-600">{watch}</p></div>
        <div><h3 className="font-medium text-slate-900">What you can do</h3><p className="mt-1 leading-6 text-slate-600">{actions}</p></div>
      </div>}
    </div>
  );
}
