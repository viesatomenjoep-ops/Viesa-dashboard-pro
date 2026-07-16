"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushNaarDrive, verwijderVanDrive } from "@/lib/drive";
import type { AdminType } from "@/lib/administratie";

/**
 * Slaat een gescande foto (bonnetje/factuur/bestelling) op in Google Drive
 * (viesatomenjoep@gmail.com). De foto gaat bewust NIET naar Supabase-opslag —
 * alleen de kleine metadata-regel (type/omschrijving/bedrag/datum + Drive-
 * verwijzing) staat in de database. Drive moet dus verbonden zijn.
 */
export async function voegScanToe(formData: FormData) {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/bestanden?fout=" + encodeURIComponent("Kies of maak eerst een foto."));
  }
  const type = (String(formData.get("type") ?? "bonnetje") || "bonnetje") as AdminType;
  const omschrijving = String(formData.get("omschrijving") ?? "").trim() || null;
  // Bedrag op de cent nauwkeurig; accepteert "12,99", "12.99" en "€ 1.234,56".
  let bedragRuw = String(formData.get("bedrag") ?? "").replace(/[^\d,.-]/g, "");
  if (bedragRuw.includes(",")) bedragRuw = bedragRuw.replace(/\./g, "").replace(",", ".");
  const bedrag = bedragRuw ? Number(bedragRuw) : null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const naam = `${type}-${Date.now()}.${ext}`;
  const mime = file.type || "image/jpeg";

  let drive: { id: string; url: string | null } | null = null;
  try {
    drive = await pushNaarDrive(naam, mime, bytes);
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
          "Google Drive is nog niet verbonden — ga naar Koppelingen en klik 'Verbind Google Drive' " +
            "(account viesatomenjoep@gmail.com). Er is niets opgeslagen.",
        ),
    );
  }

  const supabase = createClient();
  const { error } = await supabase.from("administratie").insert({
    type,
    omschrijving,
    bedrag: bedrag != null && Number.isFinite(bedrag) ? bedrag : null,
    mime,
    grootte: file.size,
    drive_url: drive.url,
    drive_file_id: drive.id,
  });
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden?scan=1");
}

/** Verwijdert een scan: het Drive-bestand, evt. oude Supabase-opslag én de metadata. */
export async function verwijderScan(id: string) {
  const supabase = createClient();
  const { data: rij } = await supabase
    .from("administratie")
    .select("storage_pad, drive_file_id")
    .eq("id", id)
    .maybeSingle();

  if (rij?.drive_file_id) {
    try {
      await verwijderVanDrive(rij.drive_file_id as string);
    } catch {
      /* best effort */
    }
  }
  // Oudere scans (van vóór de Drive-omschakeling) staan nog in de bucket.
  if (rij?.storage_pad) {
    const svc = createServiceClient();
    await svc.storage.from("administratie").remove([rij.storage_pad as string]);
  }
  await supabase.from("administratie").delete().eq("id", id);
  revalidatePath("/bestanden");
}
