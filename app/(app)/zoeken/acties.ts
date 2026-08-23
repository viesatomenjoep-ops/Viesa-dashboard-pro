"use server";

import { createClient } from "@/lib/supabase/server";
import { beantwoordVraag } from "@/lib/ai/kennis";

/** Kennis-/zoekagent (#9): beantwoordt een vraag op basis van de dashboarddata. */
export async function vraagAiOverData(vraag: string) {
  const supabase = createClient();
  return beantwoordVraag(supabase, vraag);
}
