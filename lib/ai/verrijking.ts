import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";

/**
 * Lead-verrijkings- & scoring-agent (#2). Bekijkt een lead (en, best-effort, de
 * tekst van zijn website) en stelt voor: een score met onderbouwing, branche,
 * bedrijfsgrootte, een passend IT-aanbod en een openingszin. De agent SCHRIJFT
 * NIETS — de gebruiker kiest wat hij toepast.
 */

export type Verrijking = {
  score: number;
  branche: string | null;
  bedrijfsgrootte: string | null;
  it_aanbod: string | null;
  openingszin: string | null;
  samenvatting: string;
  redenen: string[];
};

type LeadRij = {
  id: string;
  bedrijf: string | null;
  website: string | null;
  plaats: string | null;
  branche: string | null;
  bedrijfsgrootte: string | null;
  it_aanbod: string | null;
  platform: string | null;
  notities: string | null;
  score: number | null;
  contact_naam: string | null;
  functie: string | null;
};

/** Haalt best-effort de leesbare tekst van een website op (kort, met time-out). */
async function haalWebsiteTekst(url: string | null): Promise<string> {
  if (!url) return "";
  const net = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(net, {
      signal: controller.signal,
      headers: { "user-agent": "ViesaBot/1.0 (+lead-verrijking)" },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch {
    return "";
  }
}

const SYSTEM = `Je bent de sales-kwalificatie-assistent van Viesa Automations, een Nederlands bureau voor IT, webontwikkeling en (AI-)automatisering.
Je beoordeelt B2B-leads: hoe kansrijk is deze lead voor Viesa, en wat is een goede insteek?
Geef een score 0-100 (hoger = kansrijker: denk aan verouderde/ontbrekende website, groeiend bedrijf, duidelijke automatiseringsbehoefte, bereikbaarheid).
Antwoord UITSLUITEND met geldige JSON. Alles in het Nederlands, concreet, geen verzonnen feiten — baseer je op de aangeleverde gegevens en websitetekst.`;

export async function verrijkLead(
  supabase: SupabaseClient,
  leadId: string,
): Promise<{ ok: boolean; verrijking?: Verrijking; fout?: string }> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, bedrijf, website, plaats, branche, bedrijfsgrootte, it_aanbod, platform, notities, score, contact_naam, functie",
    )
    .eq("id", leadId)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Lead niet gevonden." };
  const l = data as LeadRij;

  const websiteTekst = await haalWebsiteTekst(l.website);

  const prompt = `Beoordeel deze lead voor Viesa Automations.

Leadgegevens:
- Bedrijf: ${l.bedrijf ?? "onbekend"}
- Website: ${l.website ?? "onbekend"}
- Plaats: ${l.plaats ?? "onbekend"}
- Huidige branche: ${l.branche ?? "onbekend"}
- Huidige bedrijfsgrootte: ${l.bedrijfsgrootte ?? "onbekend"}
- Huidig IT-aanbod-idee: ${l.it_aanbod ?? "onbekend"}
- Platform: ${l.platform ?? "onbekend"}
- Contact: ${l.contact_naam ?? "onbekend"}${l.functie ? ` (${l.functie})` : ""}
- Notities: ${(l.notities ?? "geen").slice(0, 600)}

Websitetekst (best-effort, kan leeg zijn):
"""${websiteTekst || "(geen tekst opgehaald)"}"""

Geef exact dit JSON-formaat:
{
  "score": <0-100>,
  "branche": "<korte branche of null>",
  "bedrijfsgrootte": "<bijv. '1-10', '10-50', '50+' of null>",
  "it_aanbod": "<welke Viesa-dienst het beste past, kort>",
  "openingszin": "<1 pakkende, gepersonaliseerde openingszin voor de cold call/mail>",
  "samenvatting": "<2-3 zinnen: wie is dit bedrijf en waarom wel/niet interessant>",
  "redenen": ["<reden voor de score>", "<reden>", "<reden>"]
}`;

  const uitkomst = await draaiAgent<Verrijking>({
    supabase,
    agent: "verrijking",
    system: SYSTEM,
    prompt,
    maxTokens: 1200,
    verwachtJson: true,
    invoer: { lead: l.bedrijf, website: Boolean(websiteTekst) },
  });

  if (!uitkomst.ok || !uitkomst.data) {
    return { ok: false, fout: uitkomst.fout ?? "Agent gaf geen resultaat." };
  }

  const v = uitkomst.data;
  const score = Math.max(0, Math.min(100, Math.round(Number(v.score) || 0)));
  return {
    ok: true,
    verrijking: {
      score,
      branche: v.branche || null,
      bedrijfsgrootte: v.bedrijfsgrootte || null,
      it_aanbod: v.it_aanbod || null,
      openingszin: v.openingszin || null,
      samenvatting: String(v.samenvatting ?? ""),
      redenen: Array.isArray(v.redenen) ? v.redenen.slice(0, 5).map((r) => String(r)) : [],
    },
  };
}
