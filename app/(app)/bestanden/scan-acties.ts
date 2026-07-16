"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushNaarDrive } from "@/lib/drive";
import type { AdminType } from "@/lib/administratie";

/** Slaat een gescande foto (bonnetje/factuur/bestelling) op + best-effort Drive. */
export async function voegScanToe(formData: FormData) {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/bestanden?fout=" + encodeURIComponent("Kies of maak eerst een foto."));
  }
  const type = (String(formData.get("type") ?? "bonnetje") || "bonnetje") as AdminType;
  const omschrijving = String(formData.get("omschrijving") ?? "").trim() || null;
  const bedragRuw = String(formData.get("bedrag") ?? "").replace(",", ".").trim();
  const bedrag = bedragRuw ? Number(bedragRuw) : null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const naam = `${type}-${Date.now()}.${ext}`;
  const pad = `${type}/${naam}`;
  const mime = file.type || "image/jpeg";

  const svc = createServiceClient();
  const { error: upFout } = await svc.storage
    .from("administratie")
    .upload(pad, bytes, { contentType: mime, upsert: false });
  if (upFout) {
    redirect("/bestanden?fout=" + encodeURIComponent("Upload mislukt: " + upFout.message));
  }

  // Best-effort doorzetten naar Google Drive (alleen als verbonden).
  let drive: { id: string; url: string | null } | null = null;
  try {
    drive = await pushNaarDrive(naam, mime, bytes);
  } catch {
    drive = null;
  }

  const supabase = createClient();
  const { error } = await supabase.from("administratie").insert({
    type,
    omschrijving,
    bedrag: bedrag != null && Number.isFinite(bedrag) ? bedrag : null,
    storage_pad: pad,
    mime,
    grootte: file.size,
    drive_url: drive?.url ?? null,
    drive_file_id: drive?.id ?? null,
  });
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden?scan=1");
}

/** Verwijdert een scan (metadata + het bestand in de bucket). */
export async function verwijderScan(id: string, pad: string | null) {
  const svc = createServiceClient();
  if (pad) await svc.storage.from("administratie").remove([pad]);
  const supabase = createClient();
  await supabase.from("administratie").delete().eq("id", id);
  revalidatePath("/bestanden");
}
