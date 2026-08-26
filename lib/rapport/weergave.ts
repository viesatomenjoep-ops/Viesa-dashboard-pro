import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Legt vast dat een klantrapport geopend is.
 *
 * Waarom dit bestaat: nadat je een Deep Scan verstuurt, hoor je niets meer. Of
 * de prospect hem geopend heeft is het sterkste belsignaal dat er is — iemand
 * die vanochtend twee keer door zijn rapport scrolde is een ander gesprek dan
 * iemand die de mail nooit aanraakte.
 *
 * Waarom met de service-role sleutel: het rapport is een openbare pagina, maar
 * de bezoeker mag niet zelf in onze tabel schrijven. Zou `anon` mogen invoegen,
 * dan kan iedereen met een deellink de teller volschrijven. De server legt het
 * dus vast, boven RLS heen (zie migratie 0049).
 *
 * Wat we bewaren is het minimum: welke scan, welk document, wanneer. Geen
 * IP-adres, geen user-agent, geen cookie. Genoeg om te weten wanneer je moet
 * bellen, zonder een verwerking die uitleg vraagt aan iemand die we nog moeten
 * leren kennen.
 */

export type { WeergaveTelling } from "./weergave-telling";

export type RapportSoort = "volledig" | "kort" | "voorstel";

/**
 * Best effort, en dat is een bewuste keuze: een klant die zijn rapport opent
 * hoort nooit een foutmelding te zien omdat ónze administratie hapert. Mislukt
 * het vastleggen, dan verliezen we een signaal — niet de bezoeker zijn rapport.
 */
export async function legWeergaveVast(scanId: string, soort: RapportSoort): Promise<void> {
  // Zonder service-role sleutel (bijvoorbeeld lokaal zonder .env) stil
  // overslaan in plaats van de pagina laten vallen.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createServiceClient();
    await supabase.from("rapport_weergaven").insert({ scan_id: scanId, soort });
  } catch {
    /* een gemist signaal is geen reden om het rapport niet te tonen */
  }
}
