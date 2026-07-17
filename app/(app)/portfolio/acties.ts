"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pushNaarDrive } from "@/lib/drive";

// Portfolio-items bewaren we in drive_links met categorie 'Portfolio' (en het
// toegestane context_type 'algemeen'), zodat er geen extra migratie nodig is.
const PORTFOLIO_CAT = "Portfolio";

/** Leidt een net link-type af (voor het juiste icoon); alle types zijn vrij tekst. */
function typeVanMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "afbeelding";
  return "overig";
}

/** Voegt een website-URL of PDF-link toe aan het portfolio. */
export async function voegPortfolioToe(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = String(formData.get("type") ?? "overig") || "overig";
  if (!titel || !url) {
    redirect("/portfolio?fout=" + encodeURIComponent("Titel en URL zijn verplicht."));
  }
  const nette = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const supabase = createClient();
  const { error } = await supabase.from("drive_links").insert({
    titel,
    url: nette,
    type,
    categorie: PORTFOLIO_CAT,
    context_type: "algemeen",
  });
  if (error) redirect("/portfolio?fout=" + encodeURIComponent(error.message));
  revalidatePath("/portfolio");
  redirect("/portfolio?opgeslagen=1");
}

/**
 * Uploadt een echt bestand (afbeelding, PDF, …) naar Google Drive en zet het als
 * portfolio-item. Drive moet verbonden zijn; zo niet, een duidelijke melding.
 */
export async function uploadPortfolio(formData: FormData) {
  const file = formData.get("bestand");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/portfolio?fout=" + encodeURIComponent("Kies eerst een bestand."));
  }
  const titel = String(formData.get("titel") ?? "").trim() || file.name;
  const mime = file.type || "application/octet-stream";
  const bytes = new Uint8Array(await file.arrayBuffer());

  let drive: { id: string; url: string | null } | null = null;
  try {
    drive = await pushNaarDrive(file.name, mime, bytes);
  } catch (e) {
    redirect(
      "/portfolio?fout=" +
        encodeURIComponent("Upload mislukt: " + (e instanceof Error ? e.message : "onbekend")),
    );
  }
  if (!drive) {
    redirect(
      "/portfolio?fout=" +
        encodeURIComponent(
          "Google Drive is nog niet verbonden — koppel eerst via Koppelingen. Er is niets opgeslagen.",
        ),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.from("drive_links").insert({
    titel,
    url: drive.url ?? "",
    type: typeVanMime(mime),
    categorie: PORTFOLIO_CAT,
    context_type: "algemeen",
    drive_file_id: drive.id,
    mime,
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
