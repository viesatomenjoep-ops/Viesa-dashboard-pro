/** Bedrag in euro's, Nederlandse notatie (bv. "€ 1.250"). */
export function euro(bedrag: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(bedrag || 0);
}

/** Datum als "14 jul 2026". */
export function datumKort(datum: string | Date): string {
  const d = typeof datum === "string" ? new Date(datum) : datum;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
