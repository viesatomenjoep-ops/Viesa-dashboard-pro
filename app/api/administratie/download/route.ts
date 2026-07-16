import JSZip from "jszip";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { driveAccessToken } from "@/lib/drive";
import { driveDownloadResponse } from "@/lib/google";
import {
  filterScans,
  scanDatum,
  type AdministratieItem,
} from "@/lib/administratie";

/**
 * Download een batch scans als één zip, gefilterd op type en periode
 * (?type=bonnetje&periode=2026-07). Periode is een voorvoegsel van de
 * automatische scandatum: "2026", "2026-07" of "2026-07-16".
 * Auth: alleen ingelogde gebruikers (de /api-routes doen hun eigen auth).
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const periode = (url.searchParams.get("periode") ?? "").trim();

  const { data, error } = await supabase
    .from("administratie")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

  const selectie = filterScans((data ?? []) as AdministratieItem[], type, periode).filter(
    (s) => s.drive_file_id || s.storage_pad,
  );
  if (selectie.length === 0) {
    return NextResponse.json(
      { fout: "Geen scans gevonden voor deze selectie." },
      { status: 404 },
    );
  }

  // Bestanden ophalen — uit Google Drive (nieuw) of de bucket (oudere scans).
  const drieToken = selectie.some((s) => s.drive_file_id) ? await driveAccessToken() : null;
  const svc = createServiceClient();
  const zip = new JSZip();
  const gebruikt = new Set<string>();
  for (const s of selectie) {
    let inhoud: ArrayBuffer | null = null;
    if (s.drive_file_id && drieToken) {
      inhoud = await driveDownloadResponse(drieToken, s.drive_file_id)
        .then((r) => r.arrayBuffer())
        .catch(() => null);
    } else if (s.storage_pad) {
      const { data: blob } = await svc.storage.from("administratie").download(s.storage_pad);
      inhoud = blob ? await blob.arrayBuffer() : null;
    }
    if (!inhoud) continue;

    const ext = (s.storage_pad?.split(".").pop() ?? s.mime?.split("/")[1] ?? "jpg").toLowerCase();
    const schoon = (s.omschrijving ?? "")
      .replace(/[^a-zA-Z0-9À-ſ _-]/g, "")
      .trim()
      .slice(0, 40);
    let naam = `${scanDatum(s.created_at)}-${s.type}${schoon ? `-${schoon}` : ""}.${ext}`;
    // Dubbele namen uniek maken.
    let i = 2;
    while (gebruikt.has(naam)) {
      naam = `${scanDatum(s.created_at)}-${s.type}${schoon ? `-${schoon}` : ""}-${i++}.${ext}`;
    }
    gebruikt.add(naam);
    zip.file(naam, inhoud);
  }

  if (gebruikt.size === 0) {
    return NextResponse.json(
      { fout: "Geen bestanden op te halen — is Google Drive verbonden (Koppelingen)?" },
      { status: 503 },
    );
  }

  const inhoud = await zip.generateAsync({ type: "uint8array" });
  const zipNaam = `administratie${type ? `-${type}` : ""}${periode ? `-${periode}` : ""}.zip`;
  return new NextResponse(Buffer.from(inhoud), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipNaam}"`,
    },
  });
}
