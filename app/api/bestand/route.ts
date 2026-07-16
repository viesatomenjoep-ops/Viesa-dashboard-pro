import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { haalVanDrive } from "@/lib/drive";

/**
 * Serveert een geüpload bestand (?id=<drive_links.id>) uit Google Drive via de
 * gekoppelde Drive, zodat elke ingelogde dashboard-gebruiker het kan bekijken
 * zonder zelf bij die Drive te hoeven. Met ?download=1 als download.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const download = url.searchParams.get("download") === "1";
  if (!id) return NextResponse.json({ fout: "id ontbreekt." }, { status: 400 });

  const { data: rij } = await supabase
    .from("drive_links")
    .select("drive_file_id, mime, titel, url")
    .eq("id", id)
    .maybeSingle();
  if (!rij) return NextResponse.json({ fout: "Niet gevonden." }, { status: 404 });

  // Geen geüpload bestand? Dan is het een gewone link — stuur door.
  if (!rij.drive_file_id) {
    if (rij.url) return NextResponse.redirect(rij.url as string);
    return NextResponse.json({ fout: "Geen bestand." }, { status: 404 });
  }

  const res = await haalVanDrive(rij.drive_file_id as string).catch(() => null);
  if (!res) {
    return NextResponse.json(
      { fout: "Google Drive is niet verbonden of het bestand is niet bereikbaar." },
      { status: 503 },
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": (rij.mime as string | null) ?? "application/octet-stream",
    "Cache-Control": "private, max-age=300",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${(rij.titel as string) ?? "bestand"}"`;
  }
  return new NextResponse(res.body, { headers });
}
