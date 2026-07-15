"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { outlookOntkoppel } from "@/lib/microsoft";
import type { IntegratieDienst, IntegratieStatus } from "@/lib/integraties";

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
