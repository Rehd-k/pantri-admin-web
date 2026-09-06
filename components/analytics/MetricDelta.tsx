import { formatNaira } from "@/lib/format";

export type AnalyticsMetric = {
  key: string;
  label: string;
  category: string;
  source: "business" | "behavioral";
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
  unit: "kobo" | "rate" | "count" | string;
  target?: number | null;
  vsTargetPct?: number | null;
  trend?: string;
};

function format(value: number, unit: string) {
  if (unit === "kobo") return formatNaira(value);
  if (unit === "rate") return `${(value * 100).toFixed(1)}%`;
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 }).format(value);
}

export function MetricDelta({ metric }: { metric: AnalyticsMetric }) {
  const up = metric.delta >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
        <span className="text-[10px] text-slate-400">{metric.source}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{format(metric.current, metric.unit)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={up ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
          {up ? "↑" : "↓"} {metric.deltaPct == null ? "—" : `${(Math.abs(metric.deltaPct) * 100).toFixed(1)}%`}
        </span>
        <span className="text-slate-500">Previous {format(metric.previous, metric.unit)}</span>
        {metric.target != null && <span className="text-slate-500">Target {format(metric.target, metric.unit)}</span>}
      </div>
    </div>
  );
}
