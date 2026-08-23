import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";

/**
 * Kennis-/zoekagent (#9) — trefwoord + AI-antwoord (geen embeddings).
 * Zoekt met tekst-filters over leads, klanten, projecten, notities, offertes en
 * facturen, en laat Claude uit die treffers één beknopt antwoord met bronnen
 * schrijven. Puur read-only.
 */

export type Bron = { type: string; titel: string; link: string; snippet: string };
export type KennisAntwoord = { antwoord: string; bronnen: Bron[] };

/** Bouwt een PostgREST-.or()-filter: elke kolom × elk woord als ilike. */
function orFilter(kolommen: string[], woorden: string[]): string {
  const delen: string[] = [];
  for (const k of kolommen) for (const w of woorden) delen.push(`${k}.ilike.%${w}%`);
  return delen.join(",");
}

function knip(tekst: string | null | undefined, n = 240): string {
  const t = (tekst ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export async function beantwoordVraag(
  supabase: SupabaseClient,
  vraag: string,
): Promise<{ ok: boolean; antwoord?: string; bronnen?: Bron[]; fout?: string }> {
  const veilig = vraag.replace(/[,()%*\\]/g, " ").trim();
  if (!veilig) return { ok: false, fout: "Geen vraag opgegeven." };
  const woorden = Array.from(new Set(veilig.split(/\s+/).filter((w) => w.length >= 3)));
  const termen = woorden.length ? woorden.slice(0, 8) : [veilig];

  const [klanten, leads, projecten, notities, offertes, facturen] = await Promise.all([
    supabase.from("klanten").select("id, bedrijf, stad, branche, notities").or(orFilter(["bedrijf", "stad", "branche", "notities", "email"], termen)).limit(5),
    supabase.from("leads").select("id, bedrijf, plaats, notities, openingszin").or(orFilter(["bedrijf", "plaats", "notities", "openingszin"], termen)).limit(5),
    supabase.from("projecten").select("id, naam, klant, omschrijving").or(orFilter(["naam", "klant", "omschrijving"], termen)).limit(5),
    supabase.from("notities").select("id, titel, inhoud_markdown, project_id, lead_id").or(orFilter(["titel", "inhoud_markdown"], termen)).limit(6),
    supabase.from("offertes").select("id, nummer, titel, klant, inhoud_markdown").or(orFilter(["nummer", "titel", "klant", "inhoud_markdown"], termen)).limit(5),
    supabase.from("facturen").select("id, nummer, klant").or(orFilter(["nummer", "klant"], termen)).limit(5),
  ]);

  const bronnen: Bron[] = [];
  (klanten.data ?? []).forEach((k) =>
    bronnen.push({ type: "Klant", titel: k.bedrijf ?? "Klant", link: `/klanten/${k.id}`, snippet: knip([k.stad, k.branche, k.notities].filter(Boolean).join(" · ")) }),
  );
  (leads.data ?? []).forEach((l) =>
    bronnen.push({ type: "Lead", titel: l.bedrijf ?? "Lead", link: `/leads/${l.id}`, snippet: knip([l.plaats, l.openingszin, l.notities].filter(Boolean).join(" · ")) }),
  );
  (projecten.data ?? []).forEach((p) =>
    bronnen.push({ type: "Project", titel: p.naam ?? "Project", link: `/projecten/${p.id}`, snippet: knip([p.klant, p.omschrijving].filter(Boolean).join(" · ")) }),
  );
  (notities.data ?? []).forEach((n) =>
    bronnen.push({ type: "Notitie", titel: n.titel ?? "Notitie", link: n.project_id ? `/projecten/${n.project_id}` : n.lead_id ? `/leads/${n.lead_id}` : "/zoeken", snippet: knip(n.inhoud_markdown) }),
  );
  (offertes.data ?? []).forEach((o) =>
    bronnen.push({ type: "Offerte", titel: `${o.nummer ?? ""} ${o.titel ?? ""}`.trim(), link: `/offertes/${o.id}`, snippet: knip([o.klant, o.inhoud_markdown].filter(Boolean).join(" · ")) }),
  );
  (facturen.data ?? []).forEach((f) =>
    bronnen.push({ type: "Factuur", titel: f.nummer ?? "Factuur", link: `/facturen/${f.id}`, snippet: knip(f.klant) }),
  );

  if (bronnen.length === 0) {
    return { ok: true, antwoord: "Ik vond hierover niets in de dashboarddata. Probeer andere trefwoorden of een naam.", bronnen: [] };
  }

  const context = bronnen
    .map((b, i) => `[${i + 1}] (${b.type}) ${b.titel}\n${b.snippet || "(geen tekst)"}`)
    .join("\n\n");

  const uitkomst = await draaiAgent<string>({
    supabase,
    agent: "kennis",
    system: `Je bent de interne kennisassistent van Viesa Automations. Beantwoord de vraag UITSLUITEND op basis van de aangeleverde bronnen.
Schrijf beknopt in het Nederlands. Verwijs naar bronnen met [nummer]. Weet je het niet op basis van de bronnen, zeg dat eerlijk. Verzin niets.`,
    prompt: `Vraag: ${vraag}\n\nBronnen:\n${context}\n\nGeef een beknopt antwoord met bronverwijzingen [nummer].`,
    maxTokens: 800,
    invoer: { vraag, bronnen: bronnen.length },
  });

  if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout ?? "Agent gaf geen antwoord.", bronnen };
  return { ok: true, antwoord: uitkomst.tekst, bronnen };
}
