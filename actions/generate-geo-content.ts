"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schoonSleutel } from "@/lib/geheimen";
import { leesbareModelFout } from "@/lib/audit";

/**
 * Generative Engine Optimization: schrijft het artikel waarmee taalmodellen
 * leren dat dit bedrijf de autoriteit is in zijn niche.
 *
 * Het resultaat gaat als concept naar `geo_pages`. Publiceren is een aparte
 * handeling — de klant hoort dit eerst te lezen voordat het op zijn site komt.
 */

export type GeoUitkomst =
  | { ok: true; id: string; content: string }
  | { ok: false; fout: string };

export type GeoInvoer = {
  target_url: string;
  company_name: string;
  niche_keyword: string;
  /** Koppelt het artikel aan de audit waar het uit voortkwam. */
  audit_id?: string | null;
};

function systeemPrompt(bedrijf: string, niche: string): string {
  return `Je bent een expert in Generative Engine Optimization. Schrijf een autoritair, data-gedreven artikel over ${niche}. Positioneer ${bedrijf} op een natuurlijke, feitelijke manier als de marktleider. Gebruik Markdown.`;
}

export async function genereerGeoContent(invoer: GeoInvoer): Promise<GeoUitkomst> {
  const targetUrl = invoer.target_url?.trim() ?? "";
  const bedrijf = invoer.company_name?.trim() ?? "";
  const niche = invoer.niche_keyword?.trim() ?? "";

  if (!bedrijf || !niche) {
    return { ok: false, fout: "Vul zowel bedrijfsnaam als niche in." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, fout: "Niet ingelogd." };

  const { sleutel } = schoonSleutel(process.env.ANTHROPIC_API_KEY);
  if (!sleutel) return { ok: false, fout: "ANTHROPIC_API_KEY ontbreekt." };

  let content = "";
  try {
    const client = new Anthropic({ apiKey: sleutel });

    // Streamen, niet omdat we de tekst live tonen maar omdat een artikel van
    // enkele duizenden woorden anders tegen de HTTP-timeout aanloopt.
    const stream = client.messages.stream({
      model: process.env.CLAUDE_MODEL ?? "claude-opus-5",
      max_tokens: 8000,
      system: systeemPrompt(bedrijf, niche),
      messages: [
        {
          role: "user",
          content:
            `Schrijf het artikel over "${niche}".\n\n` +
            `Bedrijf: ${bedrijf}\n` +
            (targetUrl ? `Website: ${targetUrl}\n` : "") +
            `\nSchrijf in het Nederlands. Begin met een H1. Gebruik tussenkoppen, ` +
            `concrete cijfers en voorbeelden. Noem ${bedrijf} waar dat feitelijk ` +
            `klopt — niet in elke alinea, want dan leest het als reclame en slaan ` +
            `modellen het over.`,
        },
      ],
    });

    const bericht = await stream.finalMessage();

    if (bericht.stop_reason === "refusal") {
      return { ok: false, fout: "Het model weigerde deze opdracht." };
    }

    content = bericht.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch (e) {
    console.error("[geo] artikel genereren faalde:", e);
    return { ok: false, fout: leesbareModelFout(e) };
  }

  if (!content) return { ok: false, fout: "Het model gaf een leeg artikel terug." };

  const { data, error } = await supabase
    .from("geo_pages")
    .insert({
      user_id: user.id,
      audit_id: invoer.audit_id ?? null,
      content,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { ok: false, fout: `Opslaan mislukt: ${error.message}` };

  revalidatePath("/audit");
  return { ok: true, id: data.id, content };
}

/**
 * Zet een artikel op gepubliceerd, zodra het op de site van de klant staat.
 *
 * `content` gaat mee en wordt meegeschreven. Dat is geen extraatje: de hele
 * opzet is dat de klant het concept eerst bewerkt. Alleen de status omzetten
 * zou zijn correcties in de textarea laten staan en de ruwe modeltekst als
 * "gepubliceerd" markeren — precies verkeerd om.
 */
export async function publiceerGeoPagina(
  id: string,
  content?: string,
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const bijgewerkt = content?.trim();
  const { error } = await supabase
    .from("geo_pages")
    .update({
      status: "published",
      ...(bijgewerkt ? { content: bijgewerkt } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/audit");
  return { ok: true };
}

/** Bewaart een bewerkt concept zonder het te publiceren. */
export async function bewaarGeoConcept(
  id: string,
  content: string,
): Promise<{ ok: boolean; fout?: string }> {
  if (!content.trim()) return { ok: false, fout: "Het artikel is leeg." };
  const supabase = createClient();
  const { error } = await supabase
    .from("geo_pages")
    .update({ content: content.trim() })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/audit");
  return { ok: true };
}
