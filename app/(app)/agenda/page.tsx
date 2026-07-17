import { Plus } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { createClient } from "@/lib/supabase/server";
import { icalEvents } from "@/lib/ical";
import type { AgendaItem } from "@/lib/google";
import { leesFout } from "@/lib/fout";
import { VolScherm } from "@/components/ui/VolScherm";
import { MaandAgenda } from "@/components/MaandAgenda";
import { OpslagMelding } from "@/components/OpslagMelding";
import { AgendaToevoegen } from "@/components/AgendaToevoegen";
import { maakAgendaItem, verwijderHerinnering, verwijderActiviteit } from "./acties";

export const dynamic = "force-dynamic";

type Bron = { id: string; naam: string; ical_url: string };
type Herinnering = { id: string; titel: string; wanneer: string };
type Activiteit = {
  id: string;
  titel: string;
  locatie: string | null;
  begin_ts: string;
  eind_ts: string | null;
  hele_dag: boolean;
};
type Toon = AgendaItem & { herinneringId?: string; activiteitId?: string };

// Agenda-tijden altijd tonen in de Nederlandse tijdzone.
const TZ = "Europe/Amsterdam";
// (geen los formulier meer; toevoegen gebeurt via AgendaToevoegen)

/** Stabiele dag-sleutel (YYYY-MM-DD) in NL-tijdzone, voor groeperen per dag. */
function dagSleutel(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
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
  searchParams: { fout?: string; opgeslagen?: string };
}) {
  const supabase = createClient();

  let bronnen: Bron[] = [];
  let herinneringen: Herinnering[] = [];
  let activiteiten: Activiteit[] = [];
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
  try {
    const { data } = await supabase
      .from("agenda_activiteiten")
      .select("id, titel, locatie, begin_ts, eind_ts, hele_dag")
      .order("begin_ts");
    activiteiten = (data ?? []) as Activiteit[];
  } catch {
    /* agenda_activiteiten-tabel nog niet aanwezig (migratie 0036) */
  }

  // Venster voor de maandkalender: vanaf het begin van deze maand, ~3 maanden
  // vooruit, zodat het huidige maandrooster (incl. eerdere dagen) gevuld is.
  const nu = new Date();
  const maandStart = new Date(nu.getFullYear(), nu.getMonth(), 1);
  const vensterEind = maandStart.getTime() + 92 * 24 * 60 * 60 * 1000;

  // iCal-afspraken ophalen + samenvoegen; fouten per bron verzamelen.
  const items: Toon[] = [];
  const bronFouten: string[] = [];
  await Promise.all(
    bronnen.map(async (b) => {
      try {
        const evs = await icalEvents(b.ical_url, { vanaf: maandStart, dagen: 92 });
        items.push(...evs);
      } catch (e) {
        bronFouten.push(`${b.naam}: ${leesFout(e)}`);
      }
    }),
  );

  // Eigen herinneringen binnen hetzelfde venster als agenda-items meenemen.
  for (const h of herinneringen) {
    const t = new Date(h.wanneer).getTime();
    if (t < maandStart.getTime() || t > vensterEind) continue;
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

  // Eigen agenda-activiteiten (onze eigen agenda) binnen het venster meenemen.
  for (const a of activiteiten) {
    const t = new Date(a.begin_ts).getTime();
    if (t < maandStart.getTime() || t > vensterEind) continue;
    items.push({
      id: `activiteit-${a.id}`,
      activiteitId: a.id,
      titel: a.titel,
      start: a.begin_ts,
      eind: a.eind_ts,
      heleDag: a.hele_dag,
      locatie: a.locatie,
      link: null,
    });
  }

  items.sort((a, b) => a.start.localeCompare(b.start));

  const vandaagSleutel = dagSleutel(nu.toISOString());
  const embed = embedUrl(bronnen);

  return (
    <>
      <PaginaKop
        titel="Agenda"
        actie={
          <div className="flex items-center gap-2">
            {embed && (
              <VolScherm
                label="Google"
                titel="Google Agenda"
                breed="vol"
                toon="navy"
                vullend
                knopKlasse="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
              >
                <iframe
                  src={embed}
                  title="Google Agenda"
                  className="h-full w-full"
                  style={{ border: 0 }}
                />
              </VolScherm>
            )}
            <VolScherm
              label=""
              titel="Nieuw"
              breed="3xl"
              icoon={<Plus size={22} />}
              standaardOpen={Boolean(searchParams.fout)}
              knopKlasse="inline-flex h-11 w-11 items-center justify-center rounded-full bg-oranje text-white shadow-sm hover:bg-oranje/90"
            >
              <AgendaToevoegen maakActie={maakAgendaItem} vandaag={vandaagSleutel} />
            </VolScherm>
          </div>
        }
      />

      <OpslagMelding toon={Boolean(searchParams.opgeslagen)} tekst="Toegevoegd aan agenda" />

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

          <MaandAgenda
            items={items}
            vandaagSleutel={vandaagSleutel}
            verwijderHerinnering={verwijderHerinnering}
            verwijderActiviteit={verwijderActiviteit}
          />
        </>
      )}
    </>
  );
}
