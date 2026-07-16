import Link from "next/link";
import { Euro, FileText, Receipt, Target } from "lucide-react";
import { Kaart } from "@/components/ui/Kaart";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { StatKaart } from "@/components/ui/StatKaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { Badge } from "@/components/ui/Badge";
import { AreaGrafiek } from "@/components/ui/AreaGrafiek";
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

// Server draait in UTC; agenda-tijden tonen in de Nederlandse tijdzone.
const TZ = "Europe/Amsterdam";

function isVandaag(iso: string): boolean {
  const opt: Intl.DateTimeFormatOptions = { timeZone: TZ };
  return (
    new Date(iso).toLocaleDateString("sv-SE", opt) ===
    new Date().toLocaleDateString("sv-SE", opt)
  );
}

function agendaTijd(it: AgendaItem): string {
  if (it.heleDag) return "Hele dag";
  return new Date(it.start).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export default async function DashboardPagina() {
  const data = await haalDashboardData();
  const supabase = createClient();

  // To-do's (best effort — tabel kan nog ontbreken).
  let taken: Taak[] = [];
  try {
    const { data: t } = await supabase
      .from("taken")
      .select("*, klanten(bedrijf)")
      .order("created_at", { ascending: true });
    taken = ((t ?? []) as (Taak & { klanten?: { bedrijf?: string } | null })[]).map((r) => ({
      ...r,
      klant_naam: r.klanten?.bedrijf ?? null,
    }));
  } catch {
    /* taken-tabel nog niet aanwezig */
  }

  // Klanten voor de taak-koppeling (best effort).
  let klantOpties: { id: string; bedrijf: string }[] = [];
  try {
    const { data: k } = await supabase
      .from("klanten")
      .select("id, bedrijf")
      .order("bedrijf");
    klantOpties = (k ?? []) as { id: string; bedrijf: string }[];
  } catch {
    /* klanten-tabel nog niet aanwezig */
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

  // Sparkline + trend voor de omzet-KPI, afgeleid van de 12-maands grafiek.
  const omzetReeks = data.omzetGrafiek.map((s) => s.waarde);
  const dezeMaand = omzetReeks[omzetReeks.length - 1] ?? 0;
  const vorigeMaand = omzetReeks[omzetReeks.length - 2] ?? 0;
  const omzetPct =
    vorigeMaand > 0 ? Math.round(((dezeMaand - vorigeMaand) / vorigeMaand) * 100) : null;
  const areaData = data.omzetGrafiek.map((s) => ({ label: s.label, waarde: s.waarde }));

  return (
    <>
      <HeroBanner
        titel="Welkom terug"
        subtekst={`Je hebt ${data.followups.length} follow-up${
          data.followups.length === 1 ? "" : "s"
        } en ${vandaagItems.length} afspra${vandaagItems.length === 1 ? "ak" : "ken"} vandaag.`}
        actie={
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            Naar pipeline →
          </Link>
        }
      />

      {/* KPI's — bovenaan, direct onder de welkomstbanner */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatKaart
          label="Omzet deze maand"
          waarde={euro(data.omzetMaand)}
          icoon={Euro}
          toon="teal"
          href="/facturen"
          sparkline={omzetReeks}
          trend={
            omzetPct === null
              ? undefined
              : { waarde: `${omzetPct >= 0 ? "+" : ""}${omzetPct}%`, positief: omzetPct >= 0 }
          }
        />
        <StatKaart
          label="Openstaand gefactureerd"
          waarde={euro(data.openstaandBedrag)}
          icoon={Receipt}
          toon="amber"
          href="/facturen"
        />
        <StatKaart
          label="Pipeline-prognose"
          waarde={euro(data.prognoseOmzet)}
          subtekst={`pipeline ${euro(data.pipelineWaarde)}`}
          icoon={Target}
          toon="blauw"
          href="/leads"
        />
        <StatKaart
          label="Lopende offertes"
          waarde={String(data.lopendeOffertes)}
          icoon={FileText}
          toon="paars"
          href="/offertes"
        />
      </section>

      {/* Follow-ups + Agenda vandaag — 2 per rij, ook op mobiel */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
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
                    <span className="block truncate font-medium text-navy">{f.bedrijf ?? "Lead"}</span>
                    <span className="block truncate text-xs text-navy/50">{f.titel ?? "Follow-up"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kaart>

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
      </section>

      {/* To-do lijst — onder Follow-ups/Agenda */}
      <section className="mt-8">
        <TakenLijst
          taken={taken}
          klanten={klantOpties}
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

      {/* Omzet per maand — onderaan het dashboard */}
      <section className="mt-8">
        <Kaart>
          <h2 className="mb-4 text-sm font-medium text-navy">
            Omzet per maand <span className="text-navy/40">(laatste 12 maanden)</span>
          </h2>
          <AreaGrafiek data={areaData} formaat="euro" />
        </Kaart>
      </section>
    </>
  );
}
