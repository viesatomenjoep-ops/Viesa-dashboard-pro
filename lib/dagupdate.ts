import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { euro } from "@/lib/format";

/**
 * Dagelijkse update: verzamelt alle wijzigingen sinds `sinds` (ISO) en bouwt er
 * een huisstijl-conforme HTML-samenvatting van. Gebruikt door de cron-route
 * /api/cron/dagupdate.
 */

export type DagData = {
  nieuweLeads: { bedrijf: string; status: string | null; score: number | null; plaats: string | null }[];
  gewijzigdeLeads: number;
  nieuweKlanten: { bedrijf: string; stad: string | null }[];
  gewijzigdeKlanten: number;
  nieuweOffertes: { nummer: string; bedrag: number | null }[];
  nieuweFacturen: { nummer: string; bedrag: number | null }[];
  nieuweProjecten: { naam: string }[];
};

async function tel(
  supabase: SupabaseClient,
  tabel: string,
  sinds: string,
  alleenGewijzigd = false,
): Promise<number> {
  let q = supabase.from(tabel).select("*", { count: "exact", head: true });
  q = alleenGewijzigd ? q.gte("updated_at", sinds).lt("created_at", sinds) : q.gte("created_at", sinds);
  const { count } = await q;
  return count ?? 0;
}

export async function verzamelDagUpdate(
  supabase: SupabaseClient,
  sinds: string,
): Promise<DagData> {
  const [
    { data: leads },
    { data: klanten },
    { data: offertes },
    { data: facturen },
    { data: projecten },
    gewijzigdeLeads,
    gewijzigdeKlanten,
  ] = await Promise.all([
    supabase.from("leads").select("bedrijf, status, score, plaats").gte("created_at", sinds).order("score", { ascending: false }),
    supabase.from("klanten").select("bedrijf, stad").gte("created_at", sinds),
    supabase.from("offertes").select("nummer, bedrag").gte("created_at", sinds),
    supabase.from("facturen").select("nummer, bedrag").gte("created_at", sinds),
    supabase.from("projecten").select("naam").gte("created_at", sinds),
    tel(supabase, "leads", sinds, true),
    tel(supabase, "klanten", sinds, true),
  ]);

  return {
    nieuweLeads: (leads ?? []) as DagData["nieuweLeads"],
    gewijzigdeLeads: Math.max(0, gewijzigdeLeads),
    nieuweKlanten: (klanten ?? []) as DagData["nieuweKlanten"],
    gewijzigdeKlanten: Math.max(0, gewijzigdeKlanten),
    nieuweOffertes: (offertes ?? []) as DagData["nieuweOffertes"],
    nieuweFacturen: (facturen ?? []) as DagData["nieuweFacturen"],
    nieuweProjecten: (projecten ?? []) as DagData["nieuweProjecten"],
  };
}

/** Totaal aantal gebeurtenissen (voor de onderwerpregel en de "niets"-check). */
export function dagTotaal(d: DagData): number {
  return (
    d.nieuweLeads.length +
    d.gewijzigdeLeads +
    d.nieuweKlanten.length +
    d.gewijzigdeKlanten +
    d.nieuweOffertes.length +
    d.nieuweFacturen.length +
    d.nieuweProjecten.length
  );
}

function chip(label: string, waarde: number): string {
  return `
    <td style="padding:6px;">
      <div style="background:#F4F6F9; border-radius:10px; padding:12px 14px; text-align:center;">
        <div style="font-size:22px; font-weight:bold; color:#19445B;">${waarde}</div>
        <div style="font-size:12px; color:#64748b;">${label}</div>
      </div>
    </td>`;
}

function sectie(titel: string, regels: string[]): string {
  if (regels.length === 0) return "";
  const lijst = regels
    .slice(0, 15)
    .map((r) => `<li style="margin:4px 0; color:#1e293b; font-size:14px;">${r}</li>`)
    .join("");
  const meer = regels.length > 15 ? `<li style="color:#64748b; font-size:13px;">+${regels.length - 15} meer…</li>` : "";
  return `
    <h2 style="color:#19445B; font-size:16px; margin:22px 0 8px; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">${titel}</h2>
    <ul style="margin:0; padding-left:18px;">${lijst}${meer}</ul>`;
}

/** Bouwt de HTML-body (zonder de buiten-wikkel; die zit in mailHtmlRijk). */
export function dagUpdateBody(d: DagData, periode: string): string {
  const totaal = dagTotaal(d);
  if (totaal === 0) {
    return `<p style="color:#1e293b; font-size:15px;">Geen wijzigingen ${periode}. Rustige dag. 🌙</p>`;
  }

  const stats = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin:4px 0 8px;">
      <tr>
        ${chip("Nieuwe leads", d.nieuweLeads.length)}
        ${chip("Nieuwe klanten", d.nieuweKlanten.length)}
        ${chip("Offertes", d.nieuweOffertes.length)}
        ${chip("Facturen", d.nieuweFacturen.length)}
      </tr>
    </table>`;

  const secties = [
    sectie(
      "Nieuwe leads",
      d.nieuweLeads.map(
        (l) =>
          `<strong>${l.bedrijf}</strong>${l.plaats ? ` — ${l.plaats}` : ""} · score ${l.score ?? 0}${l.status ? ` · ${l.status}` : ""}`,
      ),
    ),
    sectie("Nieuwe klanten", d.nieuweKlanten.map((k) => `<strong>${k.bedrijf}</strong>${k.stad ? ` — ${k.stad}` : ""}`)),
    sectie("Nieuwe offertes", d.nieuweOffertes.map((o) => `${o.nummer} · ${euro(o.bedrag ?? 0)}`)),
    sectie("Nieuwe facturen", d.nieuweFacturen.map((f) => `${f.nummer} · ${euro(f.bedrag ?? 0)}`)),
    sectie("Nieuwe projecten", d.nieuweProjecten.map((p) => p.naam)),
  ].join("");

  const bijgewerkt =
    d.gewijzigdeLeads + d.gewijzigdeKlanten > 0
      ? `<p style="color:#64748b; font-size:13px; margin-top:18px;">Daarnaast bijgewerkt: ${d.gewijzigdeLeads} lead(s) en ${d.gewijzigdeKlanten} klant(en).</p>`
      : "";

  return `
    <p style="color:#64748b; font-size:13px; margin:0 0 4px;">${periode}</p>
    ${stats}
    ${secties}
    ${bijgewerkt}`;
}

/** Platte-tekst variant voor de fallback. */
export function dagUpdateTekst(d: DagData, periode: string): string {
  const totaal = dagTotaal(d);
  if (totaal === 0) return `Geen wijzigingen ${periode}.`;
  return [
    `Dagupdate — ${periode}`,
    `Nieuwe leads: ${d.nieuweLeads.length}`,
    `Nieuwe klanten: ${d.nieuweKlanten.length}`,
    `Nieuwe offertes: ${d.nieuweOffertes.length}`,
    `Nieuwe facturen: ${d.nieuweFacturen.length}`,
    `Nieuwe projecten: ${d.nieuweProjecten.length}`,
    `Bijgewerkt: ${d.gewijzigdeLeads} leads, ${d.gewijzigdeKlanten} klanten`,
  ].join("\n");
}
