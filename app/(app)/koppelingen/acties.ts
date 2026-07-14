"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IntegratieDienst, IntegratieStatus } from "@/lib/integraties";

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
