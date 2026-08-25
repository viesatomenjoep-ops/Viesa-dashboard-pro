import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Fonio-demo-instellingen.
 *
 * Viesa wordt reseller van Fonio (AI-telefonie). Om tijdens een verkoopgesprek
 * live te kunnen demonstreren staat er een democonsole op /bellen. Wat die
 * console kan hangt af van wat het partnerprogramma biedt; daarom is alles
 * configuratie in plaats van vastgezet in code:
 *
 *   - `demonummer`  — het nummer van de demo-agent. Bellen kan altijd; dit is
 *                     de variant die zonder enige integratie werkt.
 *   - `demoUrl`     — een deelbare weblink naar de demo, om naar een prospect
 *                     te sturen of zelf te openen.
 *   - `insluiten`   — of we die URL in een iframe in het dashboard tonen. Uit
 *                     laten staan tot is vastgesteld dat Fonio insluiten
 *                     toestaat (veel SaaS blokkeert dat met X-Frame-Options).
 *   - `partnerUrl`  — het partnerportaal, om snel bij je eigen account te komen.
 *
 * Instellen doe je op /koppelingen. De config staat in de bestaande
 * `integraties`-tabel onder dienst 'fonio'; er is dus geen nieuwe tabel nodig.
 *
 * Een eventuele API-sleutel hoort in FONIO_API_KEY (server-only, nooit met een
 * NEXT_PUBLIC_-prefix) — die wordt hier bewust niet gelezen, omdat de console
 * op dit moment nog geen API-aanroepen doet.
 */
export type FonioInstellingen = {
  demonummer: string | null;
  demoUrl: string | null;
  partnerUrl: string | null;
  insluiten: boolean;
};

function tekst(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

/**
 * Leest de Fonio-instellingen. Geeft null zolang er niets is ingevuld — dan
 * blijft de democonsole onzichtbaar in plaats van een lege kaart te tonen.
 */
export async function haalFonio(): Promise<FonioInstellingen | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("integraties")
      .select("config")
      .eq("dienst", "fonio")
      .maybeSingle();
    if (error) throw error;

    const config = (data?.config ?? {}) as Record<string, unknown>;
    const instellingen: FonioInstellingen = {
      demonummer: tekst(config.demonummer),
      demoUrl: tekst(config.demo_url),
      partnerUrl: tekst(config.partner_url),
      insluiten: config.insluiten === true,
    };
    // Niets ingevuld = nog niet in gebruik.
    if (!instellingen.demonummer && !instellingen.demoUrl) return null;
    return instellingen;
  } catch {
    return null;
  }
}
