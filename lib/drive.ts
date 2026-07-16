import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { accessTokenFromRefresh, driveUpload, googleConfig } from "@/lib/google";

/**
 * Zet een bestand best-effort door naar de gekoppelde Google Drive (dienst
 * 'google_drive' in de integraties-tabel). Retourneert null als Drive niet
 * verbonden is of de upload mislukt — de scan blijft dan gewoon in de app staan.
 * Optioneel gaat het bestand in de map uit GOOGLE_DRIVE_FOLDER_ID.
 */
export async function pushNaarDrive(
  filename: string,
  mime: string,
  bytes: Uint8Array,
): Promise<{ id: string; url: string | null } | null> {
  const cfg = googleConfig();
  if (!cfg) return null;

  const svc = createServiceClient();
  const { data } = await svc
    .from("integraties")
    .select("status, config")
    .eq("dienst", "google_drive")
    .maybeSingle();

  const refresh = (data?.config as { refresh_token?: string } | null)?.refresh_token;
  if (data?.status !== "verbonden" || !refresh) return null;

  const access = await accessTokenFromRefresh(cfg, refresh);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
  return driveUpload(access, filename, mime, bytes, folderId);
}
