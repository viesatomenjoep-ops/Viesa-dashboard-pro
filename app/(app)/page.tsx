import Link from "next/link";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { Badge } from "@/components/ui/Badge";
import { StaafGrafiek } from "@/components/ui/StaafGrafiek";
import { Logo } from "@/components/ui/Logo";
import { TakenLijst } from "@/components/TakenLijst";
import { createClient } from "@/lib/supabase/server";
import { icalEvents } from "@/lib/ical";
import type { AgendaItem } from "@/lib/google";
import { euro, datumKort } from "@/lib/format";
import { scoreToon } from "@/lib/leads";
import { activiteitTypeLabel, activiteitToon } from "@/lib/activiteiten";
import type { Taak } from "@/lib/taken";
import { maakTaak, wisselTaakKlaar, verwijderTaak } from "./taken/acties";
import { haalDashboardData } from "./kpi";

export const dynamic = "force-dynamic";

function isVandaag(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function agendaTijd(it: AgendaItem): string {
  if (it.heleDag) return "Hele dag";
  return new Date(it.start).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPagina() {
  const data = await haalDashboardData();
  const supabase = createClient();

  // To-do's (best effort — tabel kan nog ontbreken).
  let taken: Taak[] = [];
  try {
    const { data: t } = await supabase
      .from("taken")
      .select("*")
      .order("created_at", { ascending: true });
    taken = (t ?? []) as Taak[];
  } catch {
    /* taken-tabel nog niet aanwezig */
  }

  // Agendapunten van vandaag (uit gekoppelde iCal-agenda's, best effort).
  let vandaagItems: AgendaItem[] = [];
  try {
    const { data: bronnen } = await supabase.from("agenda_bronnen").select("ical_url");
    const alle = (
      await Promise.all(
        (bronnen ?? []).map((b) =>
          icalEvents(b.ical_url as string, { dagen: 1 }).catch(() => [] as AgendaItem[]),
        ),
      )
    ).flat();
    vandaagItems = alle
      .filter((i) => isVandaag(i.start))
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    /* geen agenda gekoppeld */
  }

  return (
    <>
      <PaginaKop
        titel="Dashboard"
        omschrijving="Alles in één scherm — van lead tot betaalde factuur."
        actie={<Logo size={52} />}
      />

      {/* KPI's bovenaan */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/facturen">
          <KpiKaart label="Omzet deze maand" waarde={euro(data.omzetMaand)} />
        </Link>
        <Link href="/facturen">
          <KpiKaart label="Openstaand gefactureerd" waarde={euro(data.openstaandBedrag)} />
        </Link>
        <Link href="/leads">
          <KpiKaart label="Pipeline-waarde" waarde={euro(data.pipelineWaarde)} />
        </Link>
        <Link href="/offertes">
          <KpiKaart label="Lopende offertes" waarde={String(data.lopendeOffertes)} />
        </Link>
      </section>

      {/* Grafiek + follow-ups */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <Kaart className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-navy">
            Omzet per maand{" "}
            <span className="text-navy/40">(laatste 12 maanden)</span>
          </h2>
          <StaafGrafiek data={data.omzetGrafiek} />
        </Kaart>

        <div className="space-y-6">
          <Kaart>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-navy">Follow-ups vandaag</h2>
              <Badge toon={data.followups.length > 0 ? "oranje" : "grijs"}>
                {data.followups.length}
              </Badge>
            </div>
            {data.followups.length === 0 ? (
              <p className="text-sm text-navy/50">Geen follow-ups voor vandaag.</p>
            ) : (
              <ul className="space-y-2">
                {data.followups.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={f.lead_id ? `/leads/${f.lead_id}` : "/leads"}
                      className="block rounded-lg border border-navy/10 px-3 py-2 text-sm hover:bg-navy/[0.02]"
                    >
                      <span className="font-medium text-navy">{f.bedrijf ?? "Lead"}</span>
                      <span className="block text-xs text-navy/50">{f.titel ?? "Follow-up"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Kaart>

          {/* Agendapunten van vandaag */}
          <Kaart>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-navy">Agenda vandaag</h2>
              <Link href="/agenda" className="text-xs text-oranje hover:underline">
                Hele agenda →
              </Link>
            </div>
            {vandaagItems.length === 0 ? (
              <p className="text-sm text-navy/50">Geen afspraken voor vandaag.</p>
            ) : (
              <ul className="space-y-2">
                {vandaagItems.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-3 rounded-lg border border-navy/10 px-3 py-2"
                  >
                    <span className="w-16 shrink-0 text-xs font-medium text-navy/60">
                      {agendaTijd(it)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-navy">{it.titel}</span>
                  </li>
                ))}
              </ul>
            )}
          </Kaart>
        </div>
      </section>

      {/* To-do lijst (Tom / Joep / Algemeen) */}
      <section className="mt-8">
        <TakenLijst
          taken={taken}
          maakActie={maakTaak}
          wisselActie={wisselTaakKlaar}
          verwijderActie={verwijderTaak}
        />
      </section>

      {/* Recente leads + activiteitenlog */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium text-navy">Recente leads</h2>
            <Link href="/leads" className="text-sm text-oranje hover:underline">
              Alle leads →
            </Link>
          </div>
          {data.recenteLeads.length === 0 ? (
            <LegeStaat titel="Nog geen leads" />
          ) : (
            <Kaart className="p-0">
              <ul>
                {data.recenteLeads.map((l, i) => (
                  <li key={l.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                    <Link
                      href={`/leads/${l.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-navy/[0.02]"
                    >
                      <div>
                        <span className="text-sm font-medium text-navy">{l.bedrijf}</span>
                        {l.plaats && (
                          <span className="block text-xs text-navy/50">{l.plaats}</span>
                        )}
                      </div>
                      <Badge toon={scoreToon(l.score)}>{l.score}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Kaart>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-medium text-navy">Activiteitenlog</h2>
          {data.recenteActiviteiten.length === 0 ? (
            <LegeStaat titel="Nog geen activiteiten" />
          ) : (
            <Kaart className="p-0">
              <ul>
                {data.recenteActiviteiten.map((a, i) => (
                  <li
                    key={a.id}
                    className={`flex items-center justify-between gap-3 px-5 py-3 ${
                      i > 0 ? "border-t border-navy/10" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge toon={activiteitToon(a.type)}>{activiteitTypeLabel(a.type)}</Badge>
                      <span className="truncate text-sm text-navy">
                        {a.titel ?? a.bedrijf ?? "—"}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-navy/40">
                      {datumKort(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </Kaart>
          )}
        </div>
      </section>
    </>
  );
}
