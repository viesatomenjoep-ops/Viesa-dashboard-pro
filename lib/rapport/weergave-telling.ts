/**
 * Het rekenwerk rond rapportweergaven: tellen en verwoorden.
 *
 * Apart van `weergave.ts`, dat `server-only` is omdat het met de service-role
 * sleutel schrijft. Alles wat puur is hoort daarbuiten te staan, anders is het
 * niet los te testen — dezelfde les als bij `lib/site-parse.ts` en
 * `lib/scan-stappen.ts`.
 */

/** Eén regel per scan: hoe vaak geopend, en wanneer voor het laatst. */
export type WeergaveTelling = {
  scanId: string;
  aantal: number;
  laatst: string;
};

/**
 * Telt de weergaven per scan.
 *
 * In één query en daarna in geheugen groeperen: Supabase kent geen `group by`
 * via de REST-laag zonder er een view of functie voor te maken, en voor de
 * vijftig scans die de geschiedenis toont is dat de moeite niet waard.
 */
export function telWeergaven(
  rijen: { scan_id: string; bekeken_op: string }[],
): Map<string, WeergaveTelling> {
  const per = new Map<string, WeergaveTelling>();

  for (const r of rijen) {
    const bestaand = per.get(r.scan_id);
    if (!bestaand) {
      per.set(r.scan_id, { scanId: r.scan_id, aantal: 1, laatst: r.bekeken_op });
      continue;
    }
    bestaand.aantal += 1;
    // De rijen komen gesorteerd binnen, maar daar niet op vertrouwen: een
    // verkeerde "laatst geopend" is erger dan een telling die iets kost.
    if (r.bekeken_op > bestaand.laatst) bestaand.laatst = r.bekeken_op;
  }

  return per;
}

/**
 * "vandaag", "gisteren", "3 dagen geleden" — hoe lang geleden een rapport
 * geopend werd, in de taal waarin je erover denkt.
 *
 * Voor de opvolging is dat wat telt: een rapport dat gisteren open ging vraagt
 * vandaag om een telefoontje, eentje van drie weken terug niet meer.
 */
export function hoeLangGeleden(iso: string, nu: Date = new Date()): string {
  const toen = new Date(iso);
  if (Number.isNaN(toen.getTime())) return "onbekend";

  // Op kalenderdagen vergelijken en niet op 24-uursblokken: iets van gisteren
  // 23:00 voelt als gisteren, ook al is het elf uur geleden.
  const dagVan = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const dagen = Math.round((dagVan(nu) - dagVan(toen)) / 86_400_000);

  if (dagen <= 0) return "vandaag";
  if (dagen === 1) return "gisteren";
  if (dagen < 7) return `${dagen} dagen geleden`;
  if (dagen < 14) return "vorige week";
  if (dagen < 61) return `${Math.round(dagen / 7)} weken geleden`;
  return `${Math.round(dagen / 30)} maanden geleden`;
}
