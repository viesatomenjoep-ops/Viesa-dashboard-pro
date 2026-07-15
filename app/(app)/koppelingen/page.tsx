import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/server";
import {
  DIENSTEN,
  integratieStatusToon,
  integratieStatusLabel,
  type Integratie,
} from "@/lib/integraties";
import { outlookStatus } from "@/lib/microsoft";
import { wijzigIntegratieStatus, ontkoppelOutlook } from "./acties";
import { voegAgendaBronToe, verwijderAgendaBron } from "../agenda/acties";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

type AgendaBron = { id: string; naam: string; ical_url: string };

export default async function KoppelingenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let integraties: Integratie[] = [];
  let schemaOntbreekt = false;

  // Gekoppelde iCal-agenda's (best effort — tabel kan nog ontbreken).
  let agendaBronnen: AgendaBron[] = [];
  try {
    const { data } = await supabase
      .from("agenda_bronnen")
      .select("id, naam, ical_url")
      .order("created_at");
    agendaBronnen = (data ?? []) as AgendaBron[];
  } catch {
    /* agenda_bronnen nog niet aanwezig */
  }

  // Echte Outlook-status uit ms_tokens (best effort).
  let outlook: { verbonden: boolean; email?: string } = { verbonden: false };
  try {
    outlook = await outlookStatus();
  } catch {
    /* ms_tokens nog niet aanwezig */
  }

  try {
    const { data, error } = await supabase.from("integraties").select("*");
    if (error) throw error;
    integraties = (data ?? []) as Integratie[];

    // Ontbrekende diensten aanmaken (owner_id via default auth.uid()).
    const bestaand = new Set(integraties.map((i) => i.dienst));
    const missend = DIENSTEN.filter((d) => !bestaand.has(d.key));
    if (missend.length > 0) {
      await supabase
        .from("integraties")
        .insert(missend.map((d) => ({ dienst: d.key })));
      const { data: opnieuw } = await supabase.from("integraties").select("*");
      integraties = (opnieuw ?? []) as Integratie[];
    }
  } catch {
    schemaOntbreekt = true;
  }

  const statusVan = (key: string) =>
    integraties.find((i) => i.dienst === key)?.status ?? "niet_verbonden";

  return (
    <>
      <PaginaKop
        titel="Koppelingen"
        omschrijving="Beheer de verbindingen met je diensten. Geheimen staan in de omgeving/Vault, nooit in de database."
      />

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Navy banner met het beeldmerk */}
      <div className="mb-8 flex items-center gap-4 rounded-xl bg-navy px-6 py-5 text-white">
        <Logo size={56} />
        <div>
          <p className="text-lg font-semibold">Viesa Automations</p>
          <p className="text-sm text-white/70">
            Eén werkruimte voor je administratie, sales en koppelingen.
          </p>
        </div>
      </div>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de migraties uit in de Supabase SQL Editor.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIENSTEN.map((d) => {
            const isOutlook = d.key === "outlook";
            const status = isOutlook
              ? outlook.verbonden
                ? "verbonden"
                : "niet_verbonden"
              : statusVan(d.key);
            const verbonden = status === "verbonden";
            const nieuweStatus = verbonden ? "niet_verbonden" : "verbonden";
            return (
              <Kaart key={d.key} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-navy">{d.label}</h3>
                    <Badge toon={integratieStatusToon(status)}>
                      {integratieStatusLabel(status)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-navy/60">{d.omschrijving}</p>
                  {isOutlook && outlook.verbonden && outlook.email && (
                    <p className="mt-1 text-xs text-navy/40">{outlook.email}</p>
                  )}
                </div>

                {isOutlook ? (
                  <div className="mt-4 space-y-2">
                    <a
                      href="/api/auth/microsoft"
                      className={`block w-full rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                        outlook.verbonden
                          ? "border-navy/20 text-navy hover:bg-navy/5"
                          : "border-oranje bg-oranje text-white hover:bg-oranje/90"
                      }`}
                    >
                      {outlook.verbonden ? "Opnieuw koppelen" : "Outlook verbinden"}
                    </a>
                    {outlook.verbonden && (
                      <form action={ontkoppelOutlook}>
                        <button
                          type="submit"
                          className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Ontkoppelen
                        </button>
                      </form>
                    )}
                  </div>
                ) : d.key === "gmail" && !verbonden ? (
                  <a
                    href="/api/google/oauth/start"
                    className="mt-4 block w-full rounded-lg border border-oranje bg-oranje px-3 py-2 text-center text-sm font-medium text-white hover:bg-oranje/90"
                  >
                    Verbind met Google
                  </a>
                ) : (
                  <form
                    action={wijzigIntegratieStatus.bind(null, d.key, nieuweStatus)}
                    className="mt-4"
                  >
                    <button
                      type="submit"
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        verbonden
                          ? "border-navy/20 text-navy hover:bg-navy/5"
                          : "border-oranje bg-oranje text-white hover:bg-oranje/90"
                      }`}
                    >
                      {verbonden ? "Verbinding verbreken" : "Verbinden"}
                    </button>
                  </form>
                )}
              </Kaart>
            );
          })}
        </div>
      )}

      {/* Agenda (iCal-links) */}
      <Kaart className="mt-8">
        <h3 className="text-sm font-medium text-navy">Agenda (Google via iCal-link)</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-navy/60">
          <li>Open Google Calendar → hover over je agenda → ⋮ → <strong>Instellingen en delen</strong>.</li>
          <li>Scrol naar <strong>“Geheim adres in iCal-indeling”</strong> en kopieer die link.</li>
          <li>Plak de link hieronder en klik Toevoegen. De afspraken verschijnen dan op de Agenda-pagina.</li>
        </ol>
        <form action={voegAgendaBronToe} className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input name="naam" placeholder="Naam (bv. Tom)" className={inputCls} />
          <input
            name="ical_url"
            type="url"
            required
            placeholder="https://calendar.google.com/…/basic.ics *"
            className={inputCls}
          />
          <button
            type="submit"
            className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
          >
            Toevoegen
          </button>
        </form>

        {agendaBronnen.length > 0 && (
          <ul className="mt-4 divide-y divide-navy/10">
            {agendaBronnen.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-navy">
                  {b.naam}
                  <span className="ml-2 text-xs text-navy/40">{b.ical_url}</span>
                </span>
                <form action={verwijderAgendaBron.bind(null, b.id)}>
                  <button type="submit" className="text-navy/30 hover:text-red-500">×</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Kaart>

      <p className="mt-6 text-xs text-navy/50">
        OAuth-tokens en API-sleutels worden in de omgeving of Supabase Vault bewaard.
        De verbind-knoppen markeren voorlopig de status; de daadwerkelijke OAuth-flows
        worden per dienst aangesloten.
      </p>
    </>
  );
}
