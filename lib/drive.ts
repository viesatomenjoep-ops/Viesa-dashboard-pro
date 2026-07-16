import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  accessTokenFromRefresh,
  driveDelete,
  driveDownloadResponse,
  driveUpload,
  googleConfig,
} from "@/lib/google";

/**
 * Access token voor de gekoppelde Google Drive (dienst 'google_drive' in de
 * integraties-tabel). Retourneert null als Drive niet verbonden is.
 */
export async function driveAccessToken(): Promise<string | null> {
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
  return accessTokenFromRefresh(cfg, refresh);
}

/**
 * Uploadt een bestand naar de gekoppelde Google Drive. Retourneert null als
 * Drive niet verbonden is; gooit een fout als de upload zelf mislukt. Optioneel
 * gaat het bestand in de map uit GOOGLE_DRIVE_FOLDER_ID.
 */
export async function pushNaarDrive(
  filename: string,
  mime: string,
  bytes: Uint8Array,
): Promise<{ id: string; url: string | null } | null> {
  const access = await driveAccessToken();
  if (!access) return null;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;
  return driveUpload(access, filename, mime, bytes, folderId);
}

/** Haalt een Drive-bestand op als stream; null als Drive niet verbonden is. */
export async function haalVanDrive(fileId: string): Promise<Response | null> {
  const access = await driveAccessToken();
  if (!access) return null;
  return driveDownloadResponse(access, fileId);
}

/** Verwijdert een Drive-bestand (best effort). */
export async function verwijderVanDrive(fileId: string): Promise<void> {
  const access = await driveAccessToken();
  if (!access) return;
  await driveDelete(access, fileId);
}
