"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChatAfzender } from "@/lib/chat";

/** Verstuurt een chatbericht in het gedeelde teamgesprek. */
export async function stuurBericht(formData: FormData) {
  const tekst = String(formData.get("tekst") ?? "").trim();
  if (!tekst) return;
  const afzender = (String(formData.get("afzender") ?? "algemeen") ||
    "algemeen") as ChatAfzender;

  const supabase = createClient();
  await supabase.from("chat_berichten").insert({ tekst, afzender });
  revalidatePath("/chat");
}
