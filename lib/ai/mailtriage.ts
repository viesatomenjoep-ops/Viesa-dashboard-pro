import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { draaiAgent } from "./agent";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Mail-triage-agent (#4) — veilige modus: classificeert een inkomende mail,
 * vat 'm samen, adviseert een vervolgactie en schrijft een CONCEPT-antwoord in
 * huisstijl. Verstuurt of verplaatst NIETS zelf; de gebruiker bevestigt.
 */

export type MailTriage = {
  categorie: "lead" | "factuur" | "support" | "sollicitatie" | "overig";
  urgentie: "hoog" | "middel" | "laag";
  samenvatting: string;
  actie: string;
  concept_antwoord: string;
};

function htmlNaarTekst(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORIEEN = ["lead", "factuur", "support", "sollicitatie", "overig"] as const;

const SYSTEM = `Je bent de mailassistent van ${BEDRIJF.naam} (Nederlands IT/automatiseringsbureau).
Je leest een inkomende e-mail en helpt het team snel schakelen. Classificeer de mail, vat 'm kort samen, adviseer een concrete vervolgactie, en schrijf een net CONCEPT-antwoord in het Nederlands namens ${BEDRIJF.naam} (beleefd, zakelijk, to-the-point).
Antwoord UITSLUITEND met geldige JSON. Verzin geen feiten, prijzen of toezeggingen; houd het concept-antwoord veilig en algemeen waar informatie ontbreekt.`;

export async function triageMail(
  supabase: SupabaseClient,
  emailId: string,
): Promise<{ ok: boolean; triage?: MailTriage; fout?: string }> {
  const { data, error } = await supabase
    .from("emails")
    .select("van, van_naam, onderwerp, tekst, html")
    .eq("id", emailId)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Mail niet gevonden." };

  const body = (data.tekst?.trim() || (data.html ? htmlNaarTekst(data.html) : "")).slice(0, 4000);

  const prompt = `Inkomende e-mail:
Van: ${data.van_naam ?? ""} <${data.van ?? ""}>
Onderwerp: ${data.onderwerp ?? "(geen onderwerp)"}

Bericht:
"""${body || "(geen inhoud)"}"""

Geef exact dit JSON-formaat:
{
  "categorie": "lead" | "factuur" | "support" | "sollicitatie" | "overig",
  "urgentie": "hoog" | "middel" | "laag",
  "samenvatting": "<1-2 zinnen>",
  "actie": "<aanbevolen vervolgactie in 1 zin>",
  "concept_antwoord": "<compleet concept-antwoord, inclusief aanhef en afsluiting>"
}`;

  const uitkomst = await draaiAgent<MailTriage>({
    supabase,
    agent: "mailtriage",
    system: SYSTEM,
    prompt,
    maxTokens: 1000,
    verwachtJson: true,
    invoer: { onderwerp: data.onderwerp },
  });

  if (!uitkomst.ok || !uitkomst.data) {
    return { ok: false, fout: uitkomst.fout ?? "Agent gaf geen resultaat." };
  }
  const t = uitkomst.data;
  return {
    ok: true,
    triage: {
      categorie: (CATEGORIEEN.includes(t.categorie) ? t.categorie : "overig") as MailTriage["categorie"],
      urgentie: (["hoog", "middel", "laag"].includes(t.urgentie) ? t.urgentie : "middel") as MailTriage["urgentie"],
      samenvatting: String(t.samenvatting ?? ""),
      actie: String(t.actie ?? ""),
      concept_antwoord: String(t.concept_antwoord ?? ""),
    },
  };
}
