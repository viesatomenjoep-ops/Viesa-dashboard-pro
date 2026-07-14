import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KnopLink } from "@/components/ui/Knop";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { euro, datumKort } from "@/lib/format";
import { haalDashboardData } from "./kpi";

export default async function DashboardPagina() {
  const data = await haalDashboardData();

  return (
    <>
      <PaginaKop
        titel="Dashboard"
        omschrijving="Alles in één scherm — van lead tot betaalde factuur."
        actie={
          <KnopLink href="/leads" variant="primair">
            + Nieuwe lead
          </KnopLink>
        }
      />

      {/* KPI's staan altijd bovenaan */}
      <section
        aria-label="Kerncijfers"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiKaart label="Omzet deze maand" waarde={euro(data.omzetMaand)} />
        <KpiKaart
          label="Openstaande facturen"
          waarde={euro(data.openstaandBedrag)}
        />
        <KpiKaart label="Actieve deals" waarde={String(data.actieveDeals)} />
        <KpiKaart
          label="Nieuwe leads (7 dagen)"
          waarde={String(data.nieuweLeads)}
        />
      </section>

      {data.schemaOntbreekt && (
        <div className="mt-6 rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">
            Voer de migratie{" "}
            <code className="rounded bg-navy/5 px-1">
              supabase/migrations/0001_init.sql
            </code>{" "}
            uit in de Supabase SQL Editor. Daarna vullen de cijfers zich vanzelf.
          </p>
        </div>
      )}

      {/* Follow-ups van vandaag — altijd zichtbaar */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium text-navy">
          Follow-ups van vandaag
        </h2>
        {data.followupsVandaag.length === 0 ? (
          <LegeStaat
            titel="Geen follow-ups voor vandaag"
            omschrijving="Taken met een vervaldatum tot en met vandaag verschijnen hier automatisch."
          />
        ) : (
          <Kaart className="p-0">
            <ul>
              {data.followupsVandaag.map((taak, i) => (
                <li
                  key={taak.id}
                  className={`flex items-center justify-between px-6 py-3 ${
                    i > 0 ? "border-t border-navy/10" : ""
                  }`}
                >
                  <span className="text-sm text-navy">{taak.titel}</span>
                  {taak.vervaldatum && (
                    <span className="text-xs text-navy/50">
                      {datumKort(taak.vervaldatum)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Kaart>
        )}
      </section>
    </>
  );
}
