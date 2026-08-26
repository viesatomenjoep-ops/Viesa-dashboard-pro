"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { outlookOntkoppel } from "@/lib/microsoft";
import type { IntegratieDienst, IntegratieStatus } from "@/lib/integraties";
import { controleerSleutels, type SleutelStatus } from "@/lib/ai-status";

/** Ontkoppelt Outlook (verwijdert de opgeslagen tokens). */
export async function ontkoppelOutlook() {
  await outlookOntkoppel();
  revalidatePath("/koppelingen");
}

/** Zet de status van een dienst (v1: handmatig; echte OAuth volgt per dienst). */
export async function wijzigIntegratieStatus(
  dienst: IntegratieDienst,
  status: IntegratieStatus,
) {
  const supabase = createClient();
  await supabase
    .from("integraties")
    .update({ status, laatst_gecontroleerd_op: new Date().toISOString() })
    .eq("dienst", dienst);
  revalidatePath("/koppelingen");
}

/**
 * Bewaart de Fonio-demo-instellingen (demonummer, demo-link, partnerportaal).
 * Zodra er een nummer of link staat, verschijnt de democonsole op /bellen.
 *
 * De config gaat in de bestaande `integraties`-rij onder dienst 'fonio'; een
 * eventuele API-sleutel hoort niet hier maar in FONIO_API_KEY (server-only).
 */
export async function bewaarFonio(formData: FormData) {
  const tekst = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const config = {
    demonummer: tekst("demonummer"),
    demo_url: tekst("demo_url"),
    partner_url: tekst("partner_url"),
    insluiten: formData.get("insluiten") === "on",
  };
  const ingesteld = Boolean(config.demonummer || config.demo_url);

  const supabase = createClient();
  await supabase
    .from("integraties")
    .upsert(
      {
        dienst: "fonio",
        config,
        status: ingesteld ? "verbonden" : "niet_verbonden",
        laatst_gecontroleerd_op: new Date().toISOString(),
      },
      { onConflict: "dienst" },
    );

  revalidatePath("/koppelingen");
  revalidatePath("/bellen");
}

/**
 * Controleert de AI-sleutels. Alleen voor ingelogde gebruikers: elke controle is
 * een echte aanroep naar een betaalde dienst.
 *
 * Geeft nooit een sleutelwaarde terug — alleen of hij staat en of hij werkt.
 */
export async function controleerAiSleutels(): Promise<SleutelStatus[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  return controleerSleutels();
}
