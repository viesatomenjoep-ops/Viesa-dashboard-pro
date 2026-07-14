"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DriveLinkType } from "@/lib/drivelinks";

/** Voegt een Drive-link toe aan de centrale bestanden-lijst (nooit bestanden zelf). */
export async function voegBestandToe(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    redirect("/bestanden?fout=" + encodeURIComponent("URL is verplicht."));
  }
  const supabase = createClient();
  const { error } = await supabase.from("drive_links").insert({
    titel: String(formData.get("titel") ?? "").trim() || url,
    url,
    type: (String(formData.get("type") ?? "drive") || "drive") as DriveLinkType,
    context_type: "algemeen",
  });
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden");
}

export async function verwijderBestand(id: string) {
  const supabase = createClient();
  await supabase.from("drive_links").delete().eq("id", id);
  revalidatePath("/bestanden");
}
