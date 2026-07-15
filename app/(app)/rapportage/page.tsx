import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { createClient } from "@/lib/supabase/server";
import { euro } from "@/lib/format";

export const dynamic = "force-dynamic";

function maandKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type MaandRij = {
  key: string;
  label: string;
  omzet: number;
  betaald: number;
  nieuweKlanten: number;
  nieuweLeads: number;
};

export default async function RapportagePagina() {
  const supabase = createClient();
  const nu = new Date();

  const [omzet, facturen, klanten, leads] = await Promise.all([
    supabase.from("omzet_per_maand").select("maand, omzet"),
    supabase.from("facturen").select("betaald_op, status, bedrag"),
    supabase.from("klanten").select("created_at"),
    supabase.from("leads").select("created_at"),
  ]);

  const omzetPer = new Map<string, number>();
  for (const r of omzet.data ?? []) {
    omzetPer.set(maandKey(new Date(r.maand as string)), Number(r.omzet ?? 0));
  }
  const betaaldPer = new Map<string, number>();
  for (const f of facturen.data ?? []) {
    if (f.status === "betaald" && f.betaald_op) {
      const k = maandKey(new Date(f.betaald_op as string));
      betaaldPer.set(k, (betaaldPer.get(k) ?? 0) + 1);
    }
  }
  const klantenPer = new Map<string, number>();
  for (const k of klanten.data ?? []) {
    const key = maandKey(new Date(k.created_at as string));
    klantenPer.set(key, (klantenPer.get(key) ?? 0) + 1);
  }
  const leadsPer = new Map<string, number>();
  for (const l of leads.data ?? []) {
    const key = maandKey(new Date(l.created_at as string));
    leadsPer.set(key, (leadsPer.get(key) ?? 0) + 1);
  }

  const rijen: MaandRij[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
    const key = maandKey(d);
    rijen.push({
      key,
      label: d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }),
      omzet: omzetPer.get(key) ?? 0,
      betaald: betaaldPer.get(key) ?? 0,
      nieuweKlanten: klantenPer.get(key) ?? 0,
      nieuweLeads: leadsPer.get(key) ?? 0,
    });
  }

  const jaarOmzet = rijen.reduce((s, r) => s + r.omzet, 0);
  const jaarKlanten = rijen.reduce((s, r) => s + r.nieuweKlanten, 0);
  const jaarLeads = rijen.reduce((s, r) => s + r.nieuweLeads, 0);
  const openstaand = (facturen.data ?? [])
    .filter((f) => f.status === "open" || f.status === "vervallen")
    .reduce((s, f) => s + Number(f.bedrag ?? 0), 0);

  return (
    <>
      <PaginaKop
        titel="Rapportage"
        omschrijving="Maandcijfers en exports voor de boekhouding."
      />

      {/* KPI's bovenaan */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiKaart label="Omzet laatste 12 mnd" waarde={euro(jaarOmzet)} />
        <KpiKaart label="Openstaand gefactureerd" waarde={euro(openstaand)} />
        <KpiKaart label="Nieuwe klanten (12 mnd)" waarde={String(jaarKlanten)} />
        <KpiKaart label="Nieuwe leads (12 mnd)" waarde={String(jaarLeads)} />
      </section>

      {/* Exports */}
      <section className="mt-8">
        <Kaart>
          <h2 className="text-sm font-medium text-navy">Exporteren (CSV)</h2>
          <p className="mt-1 text-xs text-navy/60">
            Download een compleet overzicht als CSV — opent direct in Excel of Google Sheets.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ExportKnop type="facturen" label="Facturen" />
            <ExportKnop type="offertes" label="Offertes" />
            <ExportKnop type="klanten" label="Klanten" />
            <ExportKnop type="maandomzet" label="Maandomzet" />
          </div>
        </Kaart>
      </section>

      {/* Maandtabel */}
      <section className="mt-8">
        <Kaart className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-xs uppercase tracking-wide text-navy/50">
                  <th className="px-5 py-3 font-medium">Maand</th>
                  <th className="px-5 py-3 text-right font-medium">Omzet</th>
                  <th className="px-5 py-3 text-right font-medium">Betaalde facturen</th>
                  <th className="px-5 py-3 text-right font-medium">Nieuwe klanten</th>
                  <th className="px-5 py-3 text-right font-medium">Nieuwe leads</th>
                </tr>
              </thead>
              <tbody>
                {rijen.map((r) => (
                  <tr key={r.key} className="border-b border-navy/5 last:border-0">
                    <td className="px-5 py-3 capitalize text-navy">{r.label}</td>
                    <td className="px-5 py-3 text-right font-medium text-navy">{euro(r.omzet)}</td>
                    <td className="px-5 py-3 text-right text-navy/70">{r.betaald}</td>
                    <td className="px-5 py-3 text-right text-navy/70">{r.nieuweKlanten}</td>
                    <td className="px-5 py-3 text-right text-navy/70">{r.nieuweLeads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kaart>
      </section>
    </>
  );
}

function ExportKnop({ type, label }: { type: string; label: string }) {
  return (
    <a
      href={`/api/export?type=${type}`}
      className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
    >
      ↓ {label}
    </a>
  );
}
