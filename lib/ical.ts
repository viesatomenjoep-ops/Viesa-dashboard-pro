import "server-only";
import ical from "node-ical";
import type { AgendaItem } from "@/lib/google";

/**
 * Leest afspraken uit een openbare/geheime iCal (.ics) URL — bv. het
 * "Geheim adres in iCal-indeling" van een Google-agenda. Geen OAuth nodig.
 * Terugkerende afspraken (RRULE) worden binnen het venster uitgeklapt.
 */
export async function icalEvents(
  url: string,
  opts?: { dagen?: number; vanaf?: Date },
): Promise<AgendaItem[]> {
  const dagen = opts?.dagen ?? 30;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`iCal ${res.status}: ${await res.text()}`);
  const tekst = await res.text();

  const data = ical.sync.parseICS(tekst);
  // Ondergrens van het venster: standaard 'nu', maar voor de maandkalender geven
  // we het begin van de maand mee zodat ook afspraken eerder deze maand meekomen.
  const nu = opts?.vanaf ?? new Date();
  const tot = new Date(nu.getTime() + dagen * 24 * 60 * 60 * 1000);
  const items: AgendaItem[] = [];

  for (const key of Object.keys(data)) {
    const ev = data[key] as unknown as {
      type?: string;
      uid?: string;
      summary?: unknown;
      location?: unknown;
      url?: unknown;
      start?: string | number | Date;
      end?: string | number | Date;
      datetype?: string;
      rrule?: { between: (a: Date, b: Date, inc?: boolean) => Date[] };
      exdate?: Record<string, string | number | Date>;
    };
    if (!ev || ev.type !== "VEVENT" || !ev.start) continue;

    const heleDag = ev.datetype === "date";
    const duur =
      ev.end && ev.start ? new Date(ev.end).getTime() - new Date(ev.start).getTime() : 0;

    const maak = (start: Date): AgendaItem => ({
      id: `${String(ev.uid ?? key)}-${start.getTime()}`,
      titel: (ev.summary ? String(ev.summary) : "").trim() || "(geen titel)",
      start: start.toISOString(),
      eind: duur ? new Date(start.getTime() + duur).toISOString() : null,
      heleDag,
      locatie: ev.location ? String(ev.location) : null,
      link: ev.url ? String(ev.url) : null,
    });

    if (ev.rrule) {
      const uitgeklapt = ev.rrule.between(nu, tot, true);
      const exdates = new Set(
        Object.values(ev.exdate ?? {}).map((d) => new Date(d).getTime()),
      );
      for (const d of uitgeklapt) {
        if (exdates.has(new Date(d).getTime())) continue;
        items.push(maak(new Date(d)));
      }
    } else {
      const s = new Date(ev.start);
      if (s >= nu && s <= tot) items.push(maak(s));
    }
  }

  items.sort((a, b) => a.start.localeCompare(b.start));
  return items;
}
