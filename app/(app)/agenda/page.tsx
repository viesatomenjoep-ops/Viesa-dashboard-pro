import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { icalEvents } from "@/lib/ical";
import type { AgendaItem } from "@/lib/google";
import { leesFout } from "@/lib/fout";
import { maakHerinnering, verwijderHerinnering } from "./acties";

export const dynamic = "force-dynamic";

type Bron = { id: string; naam: string; ical_url: string };
type Herinnering = { id: string; titel: string; wanneer: string };
type Toon = AgendaItem & { herinneringId?: string };

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

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

/** Leidt de Google-embed-URL af uit de iCal-links (agenda-id na /ical/). */
function embedUrl(bronnen: Bron[]): string | null {
  const ids = bronnen
    .map((b) => b.ical_url.match(/\/ical\/([^/]+)\//)?.[1])
    .filter(Boolean) as string[];
  if (ids.length === 0) return null;
  const src = ids.map((id) => `src=${id}`).join("&");
  return `https://calendar.google.com/calendar/embed?ctz=Europe%2FAmsterdam&${src}`;
}

export default async function AgendaPagina({
  searchParams,
}: {
  searchParams: { fout?: string; weergave?: string };
}) {
  const supabase = createClient();
  const google = searchParams.weergave === "google";

  let bronnen: Bron[] = [];
  let herinneringen: Herinnering[] = [];
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
  try {
    const { data } = await supabase
      .from("herinneringen")
      .select("id, titel, wanneer")
      .order("wanneer");
    herinneringen = (data ?? []) as Herinnering[];
  } catch {
    /* herinneringen-tabel nog niet aanwezig */
  }

  // iCal-afspraken ophalen + samenvoegen; fouten per bron verzamelen.
  const items: Toon[] = [];
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

  // Eigen herinneringen (komende 30 dagen) als agenda-items meenemen.
  for (const h of herinneringen) {
    if (!binnenDagen(h.wanneer, 30)) continue;
    items.push({
      id: `herinnering-${h.id}`,
      herinneringId: h.id,
      titel: `⏰ ${h.titel}`,
      start: h.wanneer,
      eind: null,
      heleDag: false,
      locatie: null,
      link: null,
    });
  }

  items.sort((a, b) => a.start.localeCompare(b.start));

  const perDag = new Map<string, Toon[]>();
  for (const it of items) {
    const sleutel = new Date(it.start).toDateString();
    if (!perDag.has(sleutel)) perDag.set(sleutel, []);
    perDag.get(sleutel)!.push(it);
  }

  const vandaag = items.filter((i) => isVandaag(i.start)).length;
  const week = items.filter((i) => binnenDagen(i.start, 7)).length;
  const embed = embedUrl(bronnen);

  return (
    <>
      <PaginaKop
        titel="Agenda"
        actie={
          <div className="flex rounded-lg border border-navy/20 p-0.5 text-sm">
            <Link
              href="/agenda"
              className={`rounded-md px-3 py-1.5 font-medium ${
                !google ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
              }`}
            >
              Lijst
            </Link>
            <Link
              href="/agenda?weergave=google"
              className={`rounded-md px-3 py-1.5 font-medium ${
                google ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
              }`}
            >
              Google-weergave
            </Link>
          </div>
        }
      />

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
      ) : google ? (
        embed ? (
          <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
            <iframe
              src={embed}
              title="Google Agenda"
              className="h-[70vh] w-full"
              style={{ border: 0 }}
            />
          </div>
        ) : (
          <LegeStaat
            titel="Geen Google-weergave beschikbaar"
            omschrijving="Koppel eerst een Google-agenda via Koppelingen (iCal-link)."
          />
        )
      ) : (
        <>
          {/* Eigen herinnering toevoegen */}
          <Kaart className="mb-6">
            <p className="mb-2 text-sm font-medium text-navy">Herinnering toevoegen</p>
            <form action={maakHerinnering} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
              <input name="titel" required placeholder="Waar wil je aan denken?" className={inputCls} />
              <input name="wanneer" type="datetime-local" required className={inputCls} />
              <button
                type="submit"
                className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
              >
                + Herinnering
              </button>
            </form>
          </Kaart>

          {bronFouten.length > 0 && (
            <div className="mb-6 rounded-xl border border-oranje/40 bg-oranje/5 p-3 text-xs text-navy/70">
              {bronFouten.map((f, i) => (
                <p key={i}>Kon een agenda niet laden — {f}</p>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <LegeStaat
              titel="Geen afspraken of herinneringen"
              omschrijving="Koppel je Google-agenda via Koppelingen, of voeg hierboven een herinnering toe."
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
                          {it.herinneringId && (
                            <form action={verwijderHerinnering.bind(null, it.herinneringId)}>
                              <button type="submit" className="text-navy/30 hover:text-red-500">×</button>
                            </form>
                          )}
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
