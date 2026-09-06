export type CohortRow = { cohortMonth?: string; cohortWeek?: string; size: number; retainedRates: number[] };

export function CohortHeatmap({ cohorts }: { cohorts: CohortRow[] }) {
  if (!cohorts.length) return <p className="py-10 text-center text-sm text-slate-500">No cohort history available.</p>;
  const periods = Math.max(...cohorts.map((cohort) => cohort.retainedRates.length), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-xs">
        <thead><tr className="text-left text-slate-500"><th className="p-2">Cohort</th><th className="p-2">Size</th>{Array.from({ length: periods }, (_, i) => <th key={i} className="p-2">M{i}</th>)}</tr></thead>
        <tbody>{cohorts.map((cohort) => <tr key={cohort.cohortMonth ?? cohort.cohortWeek} className="border-t border-slate-100">
          <td className="p-2 font-medium">{cohort.cohortMonth ?? cohort.cohortWeek}</td><td className="p-2">{cohort.size}</td>
          {Array.from({ length: periods }, (_, i) => { const rate = cohort.retainedRates[i]; return <td key={i} className="p-1"><div className="rounded px-2 py-2 text-center" style={{ backgroundColor: rate == null ? "#f8fafc" : `rgba(4,120,87,${0.08 + rate * 0.8})`, color: rate > 0.55 ? "white" : "#334155" }}>{rate == null ? "—" : `${(rate * 100).toFixed(0)}%`}</div></td>; })}
        </tr>)}</tbody>
      </table>
    </div>
  );
}
