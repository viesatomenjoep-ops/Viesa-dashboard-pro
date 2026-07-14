import Link from "next/link";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { Badge } from "@/components/ui/Badge";
import { StaafGrafiek } from "@/components/ui/StaafGrafiek";
import { Logo } from "@/components/ui/Logo";
import { euro, datumKort } from "@/lib/format";
import { scoreToon } from "@/lib/leads";
import { activiteitTypeLabel, activiteitToon } from "@/lib/activiteiten";
import { haalDashboardData } from "./kpi";

export default async function DashboardPagina() {
  const data = await haalDashboardData();

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

      {data.schemaOntbreekt && (
        <div className="mt-6 rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">
            Voer <code className="rounded bg-navy/5 px-1">0004_canoniek_datamodel.sql</code>{" "}
            (en <code className="rounded bg-navy/5 px-1">0005</code>) uit in de Supabase
            SQL Editor. Daarna is dit dashboard leeg tot je je eerste echte lead of
            factuur toevoegt.
          </p>
        </div>
      )}

      {/* Grafiek + follow-ups */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <Kaart className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-navy">
            Omzet per maand{" "}
            <span className="text-navy/40">(laatste 6 maanden)</span>
          </h2>
          <StaafGrafiek data={data.omzetGrafiek} />
        </Kaart>

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
