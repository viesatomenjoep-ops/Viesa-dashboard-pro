import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Dagelijkse cron (Vercel): zet open facturen waarvan de vervaldatum verstreken
 * is op status `vervallen`. Beveiligd met CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ fout: "CRON_SECRET ontbreekt." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  const viaQuery = new URL(request.url).searchParams.get("secret");
  if (auth !== `Bearer ${secret}` && viaQuery !== secret) {
    return NextResponse.json({ fout: "Niet geautoriseerd." }, { status: 401 });
  }

  const vandaag = new Date().toISOString().slice(0, 10);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("facturen")
    .update({ status: "vervallen" })
    .eq("status", "open")
    .lt("vervaldatum", vandaag)
    .select("id");

  if (error) return NextResponse.json({ fout: error.message }, { status: 500 });
  return NextResponse.json({ vervallen_gemarkeerd: data?.length ?? 0 });
}
