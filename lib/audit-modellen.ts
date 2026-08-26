import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { schoonSleutel } from "@/lib/geheimen";
import { createClient } from "@/lib/supabase/server";
import {
  doelGevonden,
  leesbareModelFout,
  parseConcurrenten,
  systeemOpdracht,
  type AuditResultaten,
  type Concurrent,
  type ModelUitkomst,
} from "@/lib/audit";

/**
 * De vier modelaanroepen van de AI Visibility Audit, op één plek.
 *
 * Stonden eerst in app/api/audit/route.ts. Losgetrokken toen de websitescanner
 * dezelfde vraag ging stellen: twee kopieën van vier API-aanroepen lopen
 * gegarandeerd uit elkaar zodra er één moet worden bijgewerkt.
 */

// Model-ID's uit de omgeving, met een werkende standaard. Zo hoef je bij een
// nieuwe modelversie niet te deployen — alleen een env-variabele te wijzigen.
//
// Bewust de goedkoopste bruikbare laag per aanbieder: deze vraag ("noem vijf
// bedrijven in deze niche") vraagt geen diep redeneerwerk, alleen een
// betrouwbare opsomming — precies waar een klein/snel model goed in is. Een
// zwaarder model (Opus, gpt-4o) kost hier veelvoud zonder betere antwoorden.
// Vindt u de kwaliteit van de genoemde concurrenten tegenvallen, zet dan de
// bijbehorende env-variabele hoger — dat kost geen deploy.
const MODELLEN = {
  openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  anthropic: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
  gemini: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  perplexity: process.env.PERPLEXITY_MODEL ?? "sonar",
} as const;

// ---------------------------------------------------------------------------
// De vier modellen
// ---------------------------------------------------------------------------

function vereisSleutel(naam: string, waarde: string | undefined): string {
  const { sleutel } = schoonSleutel(waarde);
  if (!sleutel) throw new Error(`${naam} ontbreekt.`);
  return sleutel;
}

async function fetchOpenAI(niche: string): Promise<Concurrent[]> {
  // `organization` alleen meesturen als het is ingesteld. Nodig zodra een
  // account bij meerdere organisaties hoort — dan weet OpenAI anders niet
  // welke het gebruik moet afrekenen. Dit is géén sleutel: een org-ID (org-…)
  // identificeert alleen de organisatie.
  const { sleutel: org } = schoonSleutel(process.env.OPENAI_ORG_ID);
  const client = new OpenAI({
    apiKey: vereisSleutel("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    ...(org ? { organization: org } : {}),
  });
  const res = await client.chat.completions.create({
    model: MODELLEN.openai,
    messages: [{ role: "user", content: systeemOpdracht(niche) }],
    response_format: { type: "json_object" },
  });
  return parseConcurrenten(res.choices[0]?.message?.content ?? "");
}

async function fetchAnthropic(niche: string): Promise<Concurrent[]> {
  const client = new Anthropic({
    apiKey: vereisSleutel("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY),
  });
  const res = await client.messages.create({
    model: MODELLEN.anthropic,
    max_tokens: 2000,
    // Geen output_config/thinking: dat bestaat pas vanaf Sonnet/Opus. Het
    // standaardmodel hier is bewust Haiku (goedkoopste laag, geen diep
    // redeneerwerk nodig om vijf bedrijfsnamen op te sommen) — Haiku wijst
    // effort/thinking-parameters af met een fout, dus die blijven weg.
    messages: [{ role: "user", content: systeemOpdracht(niche) }],
  });
  const tekst = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return parseConcurrenten(tekst);
}

async function fetchGemini(niche: string): Promise<Concurrent[]> {
  const client = new GoogleGenAI({
    apiKey: vereisSleutel("GEMINI_API_KEY", process.env.GEMINI_API_KEY),
  });
  const res = await client.models.generateContent({
    model: MODELLEN.gemini,
    contents: systeemOpdracht(niche),
    config: { responseMimeType: "application/json" },
  });
  return parseConcurrenten(res.text ?? "");
}

async function fetchPerplexity(niche: string): Promise<Concurrent[]> {
  // Perplexity spreekt het OpenAI-protocol, dus dezelfde client met een andere
  // basis-URL. Scheelt een afhankelijkheid.
  const client = new OpenAI({
    apiKey: vereisSleutel("PERPLEXITY_API_KEY", process.env.PERPLEXITY_API_KEY),
    baseURL: "https://api.perplexity.ai",
  });
  const res = await client.chat.completions.create({
    model: MODELLEN.perplexity,
    messages: [{ role: "user", content: systeemOpdracht(niche) }],
  });
  return parseConcurrenten(res.choices[0]?.message?.content ?? "");
}


/** Zet één afgeronde belofte om naar een uitkomst — mislukking blijft zichtbaar. */
export function naarUitkomst(
  uitslag: PromiseSettledResult<Concurrent[]>,
  targetUrl: string,
  model: string,
): ModelUitkomst {
  if (uitslag.status === "rejected") {
    // Het volledige verhaal naar de serverlog, een bruikbare samenvatting naar
    // de gebruiker — ruwe SDK-meldingen horen niet in een verkoopgesprek.
    console.error(`[audit] ${model} faalde:`, uitslag.reason);
    return {
      success: false,
      target_found: false,
      competitors: [],
      error: leesbareModelFout(uitslag.reason),
    };
  }
  return {
    success: true,
    target_found: doelGevonden(targetUrl, uitslag.value),
    competitors: uitslag.value,
  };
}

/**
 * Vraagt alle vier de modellen tegelijk wie zij aanraden in deze niche.
 *
 * `allSettled` en niet `all`: als Perplexity traag is of Gemini een timeout
 * geeft, hoort de audit nog steeds de andere drie te tonen. Een half antwoord
 * is bruikbaar, een mislukte audit niet.
 */
export async function vraagAlleModellen(
  niche: string,
  targetUrl: string,
): Promise<AuditResultaten> {
  const [openai, anthropic, gemini, perplexity] = await Promise.allSettled([
    fetchOpenAI(niche),
    fetchAnthropic(niche),
    fetchGemini(niche),
    fetchPerplexity(niche),
  ]);

  return {
    openai: naarUitkomst(openai, targetUrl, "openai"),
    anthropic: naarUitkomst(anthropic, targetUrl, "anthropic"),
    gemini: naarUitkomst(gemini, targetUrl, "gemini"),
    perplexity: naarUitkomst(perplexity, targetUrl, "perplexity"),
  };
}

// ---------------------------------------------------------------------------
// Hergebruik per niche — het overgrote deel van de kosten weg zonder dat de
// uitkomst voor de klant verandert
// ---------------------------------------------------------------------------

/** Hoelang een eerdere meting voor dezelfde niche hergebruikt mag worden. */
const CACHE_UUR = 24;

/**
 * Herberekent alleen "staat dit bedrijf ertussen" op een hergebruikt
 * resultaat — de concurrentenlijst zelf blijft ongewijzigd.
 */
function herwaardeer(resultaten: AuditResultaten, targetUrl: string): AuditResultaten {
  const opnieuw = (u: ModelUitkomst): ModelUitkomst =>
    u.success ? { ...u, target_found: doelGevonden(targetUrl, u.competitors) } : u;
  return {
    openai: opnieuw(resultaten.openai),
    anthropic: opnieuw(resultaten.anthropic),
    gemini: opnieuw(resultaten.gemini),
    perplexity: opnieuw(resultaten.perplexity),
  };
}

/**
 * Zoals `vraagAlleModellen`, maar hergebruikt een meting van dezelfde niche
 * van de laatste 24 uur in plaats van de vier modellen opnieuw te bevragen.
 *
 * De opdracht aan elk model is exact dezelfde nichetekst, dus twee scans in
 * dezelfde niche binnen een dag krijgen sowieso hetzelfde antwoord — alleen
 * "staat déze klant ertussen" verschilt, en dat wordt hierboven opnieuw
 * berekend op de bewaarde concurrentenlijst. Zo verdwijnt het grootste deel
 * van de kosten (vier LLM-aanroepen per scan) bij herhaalde scans in dezelfde
 * branche, zonder dat de uitkomst voor de klant verandert.
 */
export async function vraagAlleModellenMetCache(
  niche: string,
  targetUrl: string,
): Promise<{ resultaten: AuditResultaten; hergebruikt: boolean }> {
  const supabase = createClient();
  const grens = new Date(Date.now() - CACHE_UUR * 3600_000).toISOString();

  const { data } = await supabase
    .from("ai_audits")
    .select("llm_results")
    .ilike("niche_keyword", niche.trim())
    .gte("created_at", grens)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.llm_results) {
    return {
      resultaten: herwaardeer(data.llm_results as AuditResultaten, targetUrl),
      hergebruikt: true,
    };
  }

  return { resultaten: await vraagAlleModellen(niche, targetUrl), hergebruikt: false };
}
