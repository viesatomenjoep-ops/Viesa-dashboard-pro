import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { schoonSleutel } from "@/lib/geheimen";
import { treffersNaarRijen, type ZoekTreffer } from "@/lib/prospector/websearch";
import type { ProspectRij } from "@/lib/prospector/types";

/**
 * Claude als prospector-bron, met zijn eigen webzoek-tool.
 *
 * De enige bron die een zoekopdracht in gewone taal aankan: "groothandels in
 * West-Brabant die nog met losse Excel-bestanden lijken te werken" levert bij
 * Google of OSM niets, want die zoeken op woorden en op tags. Claude zoekt zelf
 * meerdere keren en beoordeelt wat hij vindt.
 *
 * Daar staat tegenover dat dit de enige bron is die per zoekopdracht geld kost
 * — vandaar de waarschuwing in de UI en het bewust lage `max_uses`. Voor een
 * gewone zoekterm als "webshop Antwerpen" is OpenStreetMap of Google Zoeken
 * goedkoper én completer; deze bron is voor de gevallen die zich niet in
 * zoekwoorden laten vangen.
 *
 * Model via CLAUDE_ZOEK_MODEL; standaard Sonnet 5, want de webzoek-tool met
 * dynamische filtering vraagt een model van die generatie of nieuwer.
 */

const MODEL = process.env.CLAUDE_ZOEK_MODEL ?? "claude-sonnet-5";

/** Wat we terug willen: puur de gevonden bedrijven, geen begeleidende tekst. */
function opdracht(zoekterm: string, locatie: string, maxResultaten: number): string {
  return `Zoek op het web naar bestaande bedrijven die voldoen aan: "${zoekterm}" in ${locatie}.

Zoek meerdere keren met verschillende formuleringen zodat je niet alleen de eerste pagina ziet.

Geef daarna UITSLUITEND een JSON-array terug, zonder inleiding en zonder markdown-hekjes, met maximaal ${maxResultaten} bedrijven:
[{"naam": "Bedrijfsnaam", "url": "https://eigen-website.nl", "plaats": "Stad", "waarom": "één zin waarom dit bedrijf past"}]

Regels:
- Alleen echte bedrijven met een eigen website. Geen LinkedIn-, Facebook- of marktplaatspagina's.
- Elk bedrijf één keer.
- Verzin niets: alleen bedrijven die je in de zoekresultaten daadwerkelijk bent tegengekomen.
- Weet je het niet zeker, laat het bedrijf dan weg.`;
}

/** Haalt de JSON-array uit het antwoord, ook als er toch praat omheen staat. */
export function parseBedrijven(
  ruw: string,
): { naam: string; url: string; plaats?: string | null; waarom?: string | null }[] {
  if (!ruw?.trim()) return [];
  let tekst = ruw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  const start = tekst.indexOf("[");
  const eind = tekst.lastIndexOf("]");
  if (start === -1 || eind <= start) return [];
  tekst = tekst.slice(start, eind + 1);

  let data: unknown;
  try {
    data = JSON.parse(tekst);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  return data
    .map((b) => {
      const r = b as Record<string, unknown>;
      return {
        naam: String(r?.naam ?? r?.name ?? "").trim(),
        url: String(r?.url ?? r?.website ?? "").trim(),
        plaats: r?.plaats ? String(r.plaats).trim() : null,
        waarom: r?.waarom ? String(r.waarom).trim() : null,
      };
    })
    .filter((b) => b.naam && b.url);
}

export async function zoekLeadsViaClaude(opts: {
  zoekterm: string;
  locatie: string;
  maxResultaten: number;
}): Promise<ProspectRij[]> {
  const { sleutel } = schoonSleutel(process.env.ANTHROPIC_API_KEY);
  if (!sleutel) throw new Error("ANTHROPIC_API_KEY ontbreekt in de serverconfiguratie.");

  const client = new Anthropic({ apiKey: sleutel });
  const max = Math.max(1, Math.min(30, Math.round(opts.maxResultaten)));

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        // Vijf zoekopdrachten is genoeg om verder te komen dan de eerste
        // pagina, en houdt de kosten van één ronde voorspelbaar.
        max_uses: 5,
      },
    ],
    messages: [{ role: "user", content: opdracht(opts.zoekterm, opts.locatie, max) }],
  });

  const tekst = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const bedrijven = parseBedrijven(tekst);
  const treffers: ZoekTreffer[] = bedrijven.map((b) => ({
    titel: b.naam,
    url: b.url,
    omschrijving: b.waarom,
  }));

  const rijen = treffersNaarRijen(treffers, { maxResultaten: max, branche: opts.zoekterm });

  // De plaats die Claude erbij gaf overnemen; de zoekmachine-omzetter kent die
  // niet, want een zoekresultaat bevat geen adres.
  for (const rij of rijen) {
    const bron = bedrijven.find((b) => rij.website?.includes(b.url.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0]));
    if (bron?.plaats) rij.plaats = bron.plaats;
  }

  return rijen;
}
