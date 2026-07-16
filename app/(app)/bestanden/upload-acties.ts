"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pushNaarDrive } from "@/lib/drive";
import type { DriveLinkType } from "@/lib/drivelinks";

/** Leidt een Drive-link-type af uit het mime-type (voor het juiste icoon). */
function typeVanMime(mime: string): DriveLinkType {
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return "sheet";
  if (mime.includes("word") || (mime.includes("document") && !mime.startsWith("image/"))) return "doc";
  return "overig";
}

/**
 * Uploadt een echt bestand (PDF/afbeelding/…) naar Google Drive
 * (viesatomenjoep@gmail.com) en zet het als item in de bestandenlijst. Drive
 * moet verbonden zijn; zo niet, dan een duidelijke melding (niets opgeslagen).
 */
export async function uploadBestand(formData: FormData) {
  const file = formData.get("bestand");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/bestanden?fout=" + encodeURIComponent("Kies eerst een bestand."));
  }
  const titel = String(formData.get("titel") ?? "").trim() || file.name;
  const categorie = String(formData.get("categorie") ?? "").trim() || null;
  const mime = file.type || "application/octet-stream";
  const bytes = new Uint8Array(await file.arrayBuffer());

  let drive: { id: string; url: string | null } | null = null;
  try {
    drive = await pushNaarDrive(file.name, mime, bytes);
  } catch (e) {
    redirect(
      "/bestanden?fout=" +
        encodeURIComponent(
          "Upload naar Google Drive mislukt: " + (e instanceof Error ? e.message : "onbekend"),
        ),
    );
  }
  if (!drive) {
    redirect(
      "/bestanden?fout=" +
        encodeURIComponent(
          "Google Drive is nog niet verbonden — koppel eerst via Koppelingen. Er is niets opgeslagen.",
        ),
    );
  }

  const supabase = createClient();
  if (categorie) {
    await supabase.from("bestand_categorieen").upsert({ naam: categorie }, { onConflict: "naam" });
  }
  const { error } = await supabase.from("drive_links").insert({
    titel,
    url: drive.url ?? "",
    type: typeVanMime(mime),
    categorie,
    context_type: "algemeen",
    drive_file_id: drive.id,
    mime,
  });
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden?geup=1");
}
