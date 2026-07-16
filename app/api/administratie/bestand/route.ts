import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { haalVanDrive } from "@/lib/drive";

/**
 * Serveert één administratie-scan (?id=…): uit Google Drive (privébestand, via
 * de gekoppelde Drive) of — voor oudere scans — uit de Supabase-bucket. Met
 * ?download=1 komt hij als download binnen (voor 'Bewaar in iCloud').
 * Auth: alleen ingelogde gebruikers.
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
    .from("administratie")
    .select("storage_pad, drive_file_id, mime, type, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!rij) return NextResponse.json({ fout: "Niet gevonden." }, { status: 404 });

  const bestandsnaam = `${rij.type}-${String(rij.created_at).slice(0, 10)}.${
    (rij.mime as string | null)?.split("/")[1] ?? "jpg"
  }`;
  const headers: Record<string, string> = {
    "Content-Type": (rij.mime as string | null) ?? "application/octet-stream",
    "Cache-Control": "private, max-age=300",
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${bestandsnaam}"`;

  if (rij.drive_file_id) {
    const res = await haalVanDrive(rij.drive_file_id as string).catch(() => null);
    if (!res) {
      return NextResponse.json(
        { fout: "Google Drive is niet verbonden of het bestand is niet bereikbaar." },
        { status: 503 },
      );
    }
    return new NextResponse(res.body, { headers });
  }

  if (rij.storage_pad) {
    const svc = createServiceClient();
    const { data: blob } = await svc.storage
      .from("administratie")
      .download(rij.storage_pad as string);
    if (!blob) return NextResponse.json({ fout: "Bestand niet gevonden." }, { status: 404 });
    return new NextResponse(Buffer.from(await blob.arrayBuffer()), { headers });
  }

  return NextResponse.json({ fout: "Geen bestand bij deze scan." }, { status: 404 });
}
