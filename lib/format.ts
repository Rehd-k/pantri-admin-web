export function formatNaira(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined || Number.isNaN(kobo)) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
  }).format(kobo / 100);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function nairaToKobo(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function koboToNairaInput(kobo: number): string {
  if (!Number.isFinite(kobo)) return "";
  return (kobo / 100).toFixed(kobo % 100 === 0 ? 0 : 2);
}

export function unitSizeLabel(unit: {
  name: string;
  dimension: string;
  milligrams: number | null;
  millilitres: number | null;
  piecesPerUnit: number | null;
}): string {
  if (unit.dimension === "MASS" && unit.milligrams && unit.milligrams > 0) {
    const grams = unit.milligrams / 1000;
    const perKg = 1_000_000 / unit.milligrams;
    const gramLabel = Number.isInteger(grams) ? String(grams) : grams.toFixed(1);
    return `1 ${unit.name} = ${gramLabel}g · ≈ ${perKg.toFixed(1)} per kg`;
  }
  if (unit.dimension === "VOLUME" && unit.millilitres && unit.millilitres > 0) {
    const perLitre = 1000 / unit.millilitres;
    return `1 ${unit.name} = ${unit.millilitres}ml · ≈ ${perLitre.toFixed(1)} per litre`;
  }
  if (unit.dimension === "COUNT" && unit.piecesPerUnit && unit.piecesPerUnit > 0) {
    return `1 ${unit.name} = ${unit.piecesPerUnit} piece${unit.piecesPerUnit === 1 ? "" : "s"}`;
  }
  return unit.name;
}
