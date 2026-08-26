import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { schoonSleutel } from "@/lib/geheimen";
import { createClient } from "@/lib/supabase/server";
import {
  doelGevonden,
  kiesGeminiModel,
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

/**
 * De modellen die deze sleutel daadwerkelijk mag gebruiken, één keer per
 * serverproces opgehaald.
 *
 * Nodig omdat Google's modelnamen per account en per API-versie verschillen:
 * een vast ingebakken `gemini-2.0-flash` gaf op een werkende sleutel toch
 * "model bestaat niet". In plaats van te blijven gokken vragen we het gewoon —
 * dat kost geen tokens, alleen een modellenlijst.
 */
let geminiModellenCache: Promise<string[]> | null = null;

function beschikbareGeminiModellen(sleutel: string): Promise<string[]> {
  geminiModellenCache ??= (async () => {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
        { headers: { "x-goog-api-key": sleutel } },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as {
        models?: { name?: string; supportedGenerationMethods?: string[] }[];
      };
      return (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => (m.name ?? "").replace(/^models\//, ""))
        .filter(Boolean);
    } catch {
      return [];
    }
  })();
  return geminiModellenCache;
}

async function fetchGemini(niche: string): Promise<Concurrent[]> {
  const sleutel = vereisSleutel("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
  const client = new GoogleGenAI({ apiKey: sleutel });

  const vraag = (model: string) =>
    client.models.generateContent({
      model,
      contents: systeemOpdracht(niche),
      config: { responseMimeType: "application/json" },
    });

  try {
    const res = await vraag(MODELLEN.gemini);
    return parseConcurrenten(res.text ?? "");
  } catch (e) {
    // Alleen bij "model bestaat niet" opnieuw proberen. Een geweigerde sleutel
    // of een bereikte limiet lost een ander model niet op, en dan hoort de
    // gebruiker de échte reden te zien.
    const bericht = e instanceof Error ? e.message : String(e ?? "");
    const status = (e as { status?: number })?.status;
    const modelOnbekend = status === 404 || /not found|does not exist|is not supported/i.test(bericht);
    if (!modelOnbekend) throw e;

    const alternatief = kiesGeminiModel(await beschikbareGeminiModellen(sleutel));
    if (!alternatief || alternatief === MODELLEN.gemini) throw e;

    console.warn(
      `[audit] Gemini-model "${MODELLEN.gemini}" bestaat niet voor deze sleutel; ` +
        `uitgeweken naar "${alternatief}". Zet GEMINI_MODEL op die waarde om de extra aanroep te besparen.`,
    );
    const res = await vraag(alternatief);
    return parseConcurrenten(res.text ?? "");
  }
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

/** De vier aanroepen, op sleutel — zodat we er ook een deelverzameling van kunnen doen. */
const FETCHERS: Record<ModelSleutel, (niche: string) => Promise<Concurrent[]>> = {
  openai: fetchOpenAI,
  anthropic: fetchAnthropic,
  gemini: fetchGemini,
  perplexity: fetchPerplexity,
};

type ModelSleutel = keyof AuditResultaten;

const ALLE_MODELLEN = ["openai", "anthropic", "gemini", "perplexity"] as const;

/**
 * Vraagt de opgegeven modellen tegelijk wie zij aanraden in deze niche.
 *
 * `allSettled` en niet `all`: als Perplexity traag is of Gemini een timeout
 * geeft, hoort de audit nog steeds de andere drie te tonen. Een half antwoord
 * is bruikbaar, een mislukte audit niet.
 */
export async function vraagModellen(
  sleutels: readonly ModelSleutel[],
  niche: string,
  targetUrl: string,
): Promise<Partial<AuditResultaten>> {
  const uitslagen = await Promise.allSettled(sleutels.map((s) => FETCHERS[s](niche)));

  const uit: Partial<AuditResultaten> = {};
  sleutels.forEach((sleutel, i) => {
    uit[sleutel] = naarUitkomst(uitslagen[i], targetUrl, sleutel);
  });
  return uit;
}

/** Alle vier tegelijk. */
export async function vraagAlleModellen(
  niche: string,
  targetUrl: string,
): Promise<AuditResultaten> {
  return (await vraagModellen(ALLE_MODELLEN, niche, targetUrl)) as AuditResultaten;
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
function herwaardeer(resultaten: Partial<AuditResultaten>, targetUrl: string): AuditResultaten {
  // Een model kan hier ontbreken: de cache bewaart alleen de modellen die
  // antwoordden. Zonder deze terugval leest `u.success` van niets, en dan valt
  // de hele scan om op een model dat toevallig stil was.
  const opnieuw = (u: ModelUitkomst | undefined): ModelUitkomst => {
    if (!u) return { success: false, target_found: false, competitors: [], error: "Geen antwoord" };
    return u.success ? { ...u, target_found: doelGevonden(targetUrl, u.competitors ?? []) } : u;
  };
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

  const gecached = (data?.llm_results ?? null) as AuditResultaten | null;
  if (!gecached) {
    return { resultaten: await vraagAlleModellen(niche, targetUrl), hergebruikt: false };
  }

  // Alleen gelúkte antwoorden zijn het hergebruiken waard.
  //
  // Een mislukking bewaren en opnieuw serveren zou een storing 24 uur lang
  // bevriezen: een verkeerd modelnaam, een verlopen sleutel of een korte
  // onderbreking blijft dan zichtbaar ook nadat hij verholpen is. Precies dat
  // gebeurde met Gemini. Dus vragen we de modellen die het niet deden gewoon
  // opnieuw, en hergebruiken we de rest.
  const bruikbaar = ALLE_MODELLEN.filter((m) => gecached[m]?.success);
  const opnieuw = ALLE_MODELLEN.filter((m) => !gecached[m]?.success);

  if (opnieuw.length === 0) {
    return { resultaten: herwaardeer(gecached, targetUrl), hergebruikt: true };
  }

  const verse = await vraagModellen(opnieuw, niche, targetUrl);
  const samen = { ...herwaardeer(gecached, targetUrl), ...verse } as AuditResultaten;

  return { resultaten: samen, hergebruikt: bruikbaar.length > 0 };
}
