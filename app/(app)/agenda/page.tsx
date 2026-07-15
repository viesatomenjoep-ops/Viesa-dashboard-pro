import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { icalEvents } from "@/lib/ical";
import type { AgendaItem } from "@/lib/google";
import { leesFout } from "@/lib/fout";

export const dynamic = "force-dynamic";

type Bron = { id: string; naam: string; ical_url: string };

function dagKop(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function tijd(item: AgendaItem): string {
  if (item.heleDag) return "Hele dag";
  const opt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const s = new Date(item.start).toLocaleTimeString("nl-NL", opt);
  if (!item.eind) return s;
  const e = new Date(item.eind).toLocaleTimeString("nl-NL", opt);
  return `${s} – ${e}`;
}

function isVandaag(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function binnenDagen(iso: string, dagen: number): boolean {
  const d = new Date(iso).getTime();
  const n = Date.now();
  return d >= n && d <= n + dagen * 24 * 60 * 60 * 1000;
}

export default async function AgendaPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();

  let bronnen: Bron[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("agenda_bronnen")
      .select("id, naam, ical_url")
      .order("created_at");
    if (error) throw error;
    bronnen = (data ?? []) as Bron[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  // Alle bronnen ophalen en samenvoegen; fouten per bron verzamelen.
  const items: AgendaItem[] = [];
  const bronFouten: string[] = [];
  await Promise.all(
    bronnen.map(async (b) => {
      try {
        const evs = await icalEvents(b.ical_url, { dagen: 30 });
        items.push(...evs);
      } catch (e) {
        bronFouten.push(`${b.naam}: ${leesFout(e)}`);
      }
    }),
  );
  items.sort((a, b) => a.start.localeCompare(b.start));

  const perDag = new Map<string, AgendaItem[]>();
  for (const it of items) {
    const sleutel = new Date(it.start).toDateString();
    if (!perDag.has(sleutel)) perDag.set(sleutel, []);
    perDag.get(sleutel)!.push(it);
  }

  const vandaag = items.filter((i) => isVandaag(i.start)).length;
  const week = items.filter((i) => binnenDagen(i.start, 7)).length;

  return (
    <>
      <PaginaKop titel="Agenda" />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Vandaag" waarde={String(vandaag)} accent={vandaag > 0} />
        <KpiKaart label="Deze week" waarde={String(week)} />
        <KpiKaart label="Komende 30 dagen" waarde={String(items.length)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0014_agenda_bronnen.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : (
        <>
          {bronFouten.length > 0 && (
            <div className="mb-6 rounded-xl border border-oranje/40 bg-oranje/5 p-3 text-xs text-navy/70">
              {bronFouten.map((f, i) => (
                <p key={i}>Kon een agenda niet laden — {f}</p>
              ))}
            </div>
          )}

          {bronnen.length === 0 ? (
            <LegeStaat
              titel="Nog geen agenda gekoppeld"
              omschrijving="Koppel je Google-agenda via Koppelingen (iCal-link)."
            />
          ) : items.length === 0 ? (
            <LegeStaat
              titel="Geen afspraken"
              omschrijving="Er staan geen afspraken in de komende 30 dagen."
            />
          ) : (
            <div className="space-y-6">
              {Array.from(perDag.entries()).map(([sleutel, dagItems]) => (
                <div key={sleutel}>
                  <p className="mb-2 text-sm font-semibold capitalize text-navy">
                    {dagKop(dagItems[0].start)}
                  </p>
                  <Kaart className="p-0">
                    <ul>
                      {dagItems.map((it, i) => (
                        <li
                          key={it.id}
                          className={`flex items-center justify-between gap-4 px-5 py-3 ${
                            i > 0 ? "border-t border-navy/10" : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="w-28 shrink-0 text-xs font-medium text-navy/50">
                              {tijd(it)}
                            </span>
                            <div className="min-w-0">
                              {it.link ? (
                                <a
                                  href={it.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-sm font-medium text-navy hover:underline"
                                >
                                  {it.titel}
                                </a>
                              ) : (
                                <span className="truncate text-sm font-medium text-navy">
                                  {it.titel}
                                </span>
                              )}
                              {it.locatie && (
                                <p className="truncate text-xs text-navy/50">{it.locatie}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Kaart>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
