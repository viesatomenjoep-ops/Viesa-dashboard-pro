/** Kleine CSV-helper. Escapet velden en gebruikt puntkomma (Excel-NL vriendelijk). */

function veld(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Bouwt een CSV-tekst uit kolomkoppen en rijen. */
export function naarCsv(kolommen: string[], rijen: (unknown[])[]): string {
  const regels = [kolommen.map(veld).join(";"), ...rijen.map((r) => r.map(veld).join(";"))];
  // BOM zodat Excel UTF-8 correct leest.
  return "﻿" + regels.join("\r\n");
}
