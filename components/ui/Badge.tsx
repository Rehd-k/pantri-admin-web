type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "success",
  APPROVED: "success",
  EXECUTED: "success",
  COMPLETED: "success",
  PENDING: "warning",
  PENDING_APPROVAL: "warning",
  PENDING_REVIEW: "warning",
  DRAFT: "warning",
  GENERATING: "info",
  PROCESSING: "info",
  FROZEN: "danger",
  SUSPENDED: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
  EXPIRED: "neutral",
  CLOSED: "neutral",
};

export function Badge({
  children,
  tone,
}: {
  children: string;
  tone?: Tone;
}) {
  const resolvedTone = tone ?? STATUS_TONE[children] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[resolvedTone]}`}
    >
      {children.replaceAll("_", " ")}
    </span>
  );
}
