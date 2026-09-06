type Stage = { key: string; uniqueActors: number; conversionFromPrevious?: number | null };

export function FunnelChart({ stages, biggestDropOff }: { stages: Stage[]; biggestDropOff?: string | null }) {
  if (!stages.length) return <p className="py-10 text-center text-sm text-slate-500">No funnel activity in this range.</p>;
  const max = Math.max(...stages.map((stage) => stage.uniqueActors), 1);
  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const highlighted = stage.key === biggestDropOff;
        return <div key={stage.key}>
          <div className="mb-1.5 flex justify-between gap-4 text-sm">
            <span className="font-medium capitalize text-slate-700">{stage.key.replaceAll("_", " ")}</span>
            <span className="text-slate-500">{stage.uniqueActors.toLocaleString()} {stage.conversionFromPrevious != null && `· ${(stage.conversionFromPrevious * 100).toFixed(1)}%`}</span>
          </div>
          <div className="h-7 overflow-hidden rounded-md bg-slate-100">
            <div className={`flex h-full min-w-2 items-center rounded-md px-2 text-xs text-white transition-all ${highlighted ? "bg-amber-600" : "bg-emerald-700"}`} style={{ width: `${Math.max(2, stage.uniqueActors / max * 100)}%` }}>
              {highlighted && <span className="whitespace-nowrap">Biggest drop-off</span>}
            </div>
          </div>
        </div>;
      })}
    </div>
  );
}
