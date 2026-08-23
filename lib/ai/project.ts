import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Project-agent: #8 (samenvatting + status-signaal + klant-update) en #10
 * (content: case-study, social post, portfolio-tekst) uit de projectnotities.
 * Read-only: levert tekst die de mens gebruikt/plaatst.
 */

export type ProjectAnalyse = { samenvatting: string; signaal: string; klant_update: string };
export type ContentSoort = "case_study" | "social" | "portfolio";

async function haalProjectContext(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ ok: boolean; kop?: string; context?: string; fout?: string }> {
  const { data: p, error } = await supabase
    .from("projecten")
    .select("naam, omschrijving, klant, status, updated_at")
    .eq("id", projectId)
    .single();
  if (error || !p) return { ok: false, fout: error?.message ?? "Project niet gevonden." };

  const { data: notities } = await supabase
    .from("notities")
    .select("titel, inhoud_markdown, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  const notitieTekst = (notities ?? [])
    .map((n) => `### ${n.titel ?? "Notitie"}\n${(n.inhoud_markdown ?? "").slice(0, 1200)}`)
    .join("\n\n");

  const context = `Project: ${p.naam}
Klant: ${p.klant ?? "onbekend"}
Status: ${p.status ?? "onbekend"}
Laatst bijgewerkt: ${p.updated_at ?? "onbekend"}
Omschrijving: ${p.omschrijving ?? "(geen)"}

Notities:
${notitieTekst || "(geen notities)"}`;

  return { ok: true, kop: p.naam ?? "Project", context };
}

export async function vatProjectSamen(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ ok: boolean; analyse?: ProjectAnalyse; fout?: string }> {
  const ctx = await haalProjectContext(supabase, projectId);
  if (!ctx.ok || !ctx.context) return { ok: false, fout: ctx.fout };

  const uitkomst = await draaiAgent<ProjectAnalyse>({
    supabase,
    agent: "project-samenvatting",
    system: `Je bent projectassistent bij ${BEDRIJF.naam}. Vat een project bondig samen op basis van de notities.
Geef ook een status-signaal (loopt het lekker, of is er risico/stilstand?) en een kort concept voor een klant-update.
Antwoord UITSLUITEND met geldige JSON. Nederlands, concreet, geen verzonnen feiten.`,
    prompt: `${ctx.context}

Geef exact: {"samenvatting": "<3-5 zinnen>", "signaal": "<1 zin: gezond / let op / risico + waarom>", "klant_update": "<kort concept-bericht aan de klant>"}`,
    maxTokens: 900,
    verwachtJson: true,
    invoer: { project: ctx.kop },
  });

  if (!uitkomst.ok || !uitkomst.data) return { ok: false, fout: uitkomst.fout ?? "Geen resultaat." };
  return {
    ok: true,
    analyse: {
      samenvatting: String(uitkomst.data.samenvatting ?? ""),
      signaal: String(uitkomst.data.signaal ?? ""),
      klant_update: String(uitkomst.data.klant_update ?? ""),
    },
  };
}

const CONTENT_OPDRACHT: Record<ContentSoort, string> = {
  case_study:
    "Schrijf een korte, wervende case-study (probleem → aanpak → resultaat) die we op onze website kunnen plaatsen. Gebruik tussenkopjes.",
  social:
    "Schrijf een pakkende LinkedIn-post (max ~120 woorden, met een haakje in de eerste zin en 3-5 relevante hashtags) over dit afgeronde project.",
  portfolio:
    "Schrijf een beknopte portfolio-omschrijving (2-3 zinnen) zoals op een 'ons werk'-overzicht.",
};

export async function genereerContent(
  supabase: SupabaseClient,
  projectId: string,
  soort: ContentSoort,
): Promise<{ ok: boolean; tekst?: string; fout?: string }> {
  const ctx = await haalProjectContext(supabase, projectId);
  if (!ctx.ok || !ctx.context) return { ok: false, fout: ctx.fout };

  const uitkomst = await draaiAgent<string>({
    supabase,
    agent: `content-${soort}`,
    system: `Je bent marketing-copywriter voor ${BEDRIJF.naam} (IT/automatisering). Schrijf in het Nederlands, enthousiast maar zakelijk.
Verzin geen cijfers of resultaten die niet in de gegevens staan; blijf dan algemeen. Noem geen vertrouwelijke details.`,
    prompt: `${ctx.context}\n\nOpdracht: ${CONTENT_OPDRACHT[soort]}`,
    maxTokens: 900,
    invoer: { project: ctx.kop, soort },
  });

  if (!uitkomst.ok) return { ok: false, fout: uitkomst.fout ?? "Geen resultaat." };
  return { ok: true, tekst: uitkomst.tekst };
}
