"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Voegt een portfolio-item toe: een website-URL of een PDF-link van een project
 * dat we ooit hebben gedaan. Opgeslagen als drive_link met context "portfolio".
 */
export async function voegPortfolioToe(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = (String(formData.get("type") ?? "overig") || "overig") as string;
  if (!titel || !url) {
    redirect("/portfolio?fout=" + encodeURIComponent("Titel en URL zijn verplicht."));
  }
  const nette = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const supabase = createClient();
  const { error } = await supabase.from("drive_links").insert({
    titel,
    url: nette,
    type,
    context_type: "portfolio",
  });
  if (error) redirect("/portfolio?fout=" + encodeURIComponent(error.message));
  revalidatePath("/portfolio");
  redirect("/portfolio?opgeslagen=1");
}

/** Verwijdert een portfolio-item. */
export async function verwijderPortfolio(id: string) {
  const supabase = createClient();
  await supabase.from("drive_links").delete().eq("id", id);
  revalidatePath("/portfolio");
}
