import Link from "next/link";

export function InsightCard({ title, body, severity, href }: { title: string; body: string; severity: string; href: string }) {
  const tone = severity === "high" ? "bg-rose-50 text-rose-700" : severity === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  const localHref = href.replace(/^\/admin/, "");
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>{severity}</span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{body}</p>
      <Link href={localHref} className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800">Investigate →</Link>
    </article>
  );
}
