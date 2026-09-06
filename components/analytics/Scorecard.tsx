import { MetricDelta, type AnalyticsMetric } from "./MetricDelta";

const ORDER = ["growth", "commerce", "credit", "payroll", "customers"];

export function Scorecard({ metrics }: { metrics: AnalyticsMetric[] }) {
  if (!metrics.length) return <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No scorecard data for this range.</p>;
  const categories = [...new Set(metrics.map((metric) => metric.category))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold capitalize text-slate-900">{category}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.filter((metric) => metric.category === category).map((metric) => <MetricDelta key={metric.key} metric={metric} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
