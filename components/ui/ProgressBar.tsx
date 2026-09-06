export function ProgressBar({
  value,
  label,
  tone = "auto",
}: {
  /** 0–100+ */
  value: number;
  label?: string;
  tone?: "auto" | "success" | "warning" | "danger";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const resolvedTone =
    tone === "auto"
      ? value >= 90
        ? "danger"
        : value >= 70
          ? "warning"
          : "success"
      : tone;
  const barClass =
    resolvedTone === "danger"
      ? "bg-red-500"
      : resolvedTone === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
