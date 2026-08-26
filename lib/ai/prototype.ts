import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { schoonSleutel } from "@/lib/geheimen";
import { leesbareModelFout } from "@/lib/audit";
import { haalWebsiteTekst } from "@/lib/site-tekst";
import type { PrototypeType } from "@/lib/website-sjabloon";

/**
 * Website-prototypegenerator: laat Claude één zelfstandige HTML-pagina bouwen
 * die laat zien hoe de website van een lead er vernieuwd uit zou kunnen zien —
 * verkoopmateriaal voor "kijk wat we voor je zouden kunnen bouwen".
 *
 * Bewust zuinig met tokens: alleen bedrijfsnaam, branche/plaats en een
 * afgekapt stukje websitetekst gaan mee als context — geen volledige HTML-dump
 * van de bestaande site. Streamen (net als de GEO-generator) omdat een
 * volledige pagina met inline CSS al snel een paar duizend tokens output is en
 * anders tegen de HTTP-timeout aanloopt.
 *
 * Draait via ANTHROPIC_API_KEY (pay-per-token, Anthropic Console) — dit is
 * productiecode die door de gebruiker in de browser wordt getriggerd, dus dit
 * loopt nooit via een Claude Code-abonnement.
 */

export type PrototypeUitkomst =
  | { ok: true; id: string; html: string; tokensIn: number; tokensUit: number; model: string }
  | { ok: false; fout: string };

type LeadRij = {
  bedrijf: string | null;
  website: string | null;
  plaats: string | null;
  branche: string | null;
  it_aanbod: string | null;
  openingszin: string | null;
};

const SYSTEM = `Je bent een senior productdesigner bij Viesa Automations, een Nederlands bureau voor webontwikkeling en automatisering.
Je bouwt een verkoopprototype: één complete, zelfstandige HTML-pagina die laat zien hoe de website van een klant er modern en professioneel uit zou kunnen zien.

Regels:
- Antwoord UITSLUITEND met de HTML, vanaf "<!doctype html>". Geen uitleg ervoor of erna, geen markdown-hekjes.
- Alles in één bestand: CSS in een <style>-blok in de <head>. Geen externe scripts, fonts, frameworks of afbeeldingen van elders (het moet ook zonder internetverbinding renderen) — gebruik CSS-gradients, vormen en emoji als visuele elementen in plaats van externe plaatjes.
- Geen JavaScript.
- Mobile-first, toegankelijk (voldoende contrast, semantische HTML), met een duidelijke call-to-action.
- Verzin geen namen, prijzen, testimonials of cijfers die niet zijn aangeleverd — baseer copy op de echte bedrijfsnaam en branche.
- Schrijf de tekst op de pagina in het Nederlands.
- Houd de CSS beknopt (geen herhaalde of overbodige regels) — de pagina moet in ruim voldoende ruimte binnen het antwoord passen, dus schrijf geen langere pagina dan nodig voor een goed eerste-indruk-prototype.`;

function prompt(l: LeadRij, url: string, websiteTekst: string, type: PrototypeType): string {
  const vorm =
    type === "app"
      ? "Bouw een mobiele-app-mockup: een pagina die een telefoonkader toont (vast formaat, bv. 360×720px, afgeronde hoeken, in het midden van het scherm) met daarin app-achtige schermonderdelen (topbalk, kaarten, een onderbalk met 3-4 iconen als tekst/emoji) — géén volledige website-lay-out."
      : "Bouw een frisse homepage: hero met pakkende titel + subtitel, een sectie met diensten/producten, een sectie die vertrouwen wekt, en een duidelijke contact/CTA-sectie.";

  return `Bouw een vernieuwd ${type === "app" ? "app" : "website"}-prototype voor dit bedrijf.

Bedrijf: ${l.bedrijf ?? "onbekend"}
Huidige website: ${url}
Plaats: ${l.plaats ?? "onbekend"}
Branche: ${l.branche ?? "onbekend"}
${l.it_aanbod ? `Kans/aanbod dat Viesa hier ziet: ${l.it_aanbod}\n` : ""}${l.openingszin ? `Insteek: ${l.openingszin}\n` : ""}
Tekst van de huidige website (kan leeg zijn als die niet op te halen was):
"""${websiteTekst || "(geen tekst opgehaald)"}"""

${vorm} Gebruik alleen wat aannemelijk is voor deze branche, niet verzonnen als concreet feit. Gebruik een kleurenpalet dat bij de branche past.`;
}

/** Genereert (en bewaart) één website- of app-prototype voor een lead. */
export async function genereerPrototype(
  supabase: SupabaseClient,
  leadId: string,
  urlOverride?: string,
  type: PrototypeType = "website",
): Promise<PrototypeUitkomst> {
  const { data, error } = await supabase
    .from("leads")
    .select("bedrijf, website, plaats, branche, it_aanbod, openingszin")
    .eq("id", leadId)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Lead niet gevonden." };
  const l = data as LeadRij;

  const url = (urlOverride?.trim() || l.website || "").trim();
  if (!url) {
    return { ok: false, fout: "Geen website bekend — vul er hierboven eerst één in." };
  }

  const { sleutel } = schoonSleutel(process.env.ANTHROPIC_API_KEY);
  if (!sleutel) return { ok: false, fout: "ANTHROPIC_API_KEY ontbreekt in de serverconfiguratie." };

  // Afgekapt tot 3000 tekens — genoeg om de kern van het bedrijf te begrijpen,
  // zonder de hele site als context mee te sturen (dat kost alleen maar tokens).
  const websiteTekst = await haalWebsiteTekst(url, 3000);
  // Bewust op Sonnet 5 in plaats van de gedeelde CLAUDE_MODEL: dit is de
  // AI-uitzondering naast het gratis sjabloon, dus kosten drukken weegt hier
  // zwaarder dan bij de audit of de GEO-generator, die wél de gedeelde
  // (doorgaans zwaardere) modelkeuze gebruiken.
  const model = process.env.PROTOTYPE_MODEL ?? "claude-sonnet-5";

  let html = "";
  let tokensIn = 0;
  let tokensUit = 0;
  try {
    const client = new Anthropic({ apiKey: sleutel });
    const stream = client.messages.stream({
      model,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(l, url, websiteTekst, type) }],
    });
    const bericht = await stream.finalMessage();
    if (bericht.stop_reason === "refusal") {
      return { ok: false, fout: "Het model weigerde deze opdracht." };
    }
    if (bericht.stop_reason === "max_tokens") {
      // De pagina is afgekapt halverwege — dat geeft ongeldige/lege HTML in
      // de preview. Beter een duidelijke fout dan een stil leeg voorbeeld.
      return {
        ok: false,
        fout: "Het prototype werd te lang en is afgekapt. Probeer het opnieuw, of vraag om een kortere pagina.",
      };
    }
    tokensIn = bericht.usage?.input_tokens ?? 0;
    tokensUit = bericht.usage?.output_tokens ?? 0;
    html = bericht.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim()
      .replace(/^```(?:html)?/i, "")
      .replace(/```$/i, "")
      .trim();
  } catch (e) {
    return { ok: false, fout: leesbareModelFout(e) };
  }

  if (!html) return { ok: false, fout: "Het model gaf geen inhoud terug." };

  // Kunnen niet opslaan (tabel ontbreekt nog) mag het resultaat niet weggooien —
  // de gebruiker ziet het prototype dan gewoon zonder dat het bewaard is.
  const { data: rij } = await supabase
    .from("website_prototypes")
    .insert({
      lead_id: leadId,
      type,
      bron: "ai",
      bron_url: url,
      html,
      model,
      tokens_in: tokensIn,
      tokens_uit: tokensUit,
    })
    .select("id")
    .single();

  return {
    ok: true,
    id: rij?.id ?? "",
    html,
    tokensIn,
    tokensUit,
    model,
  };
}
