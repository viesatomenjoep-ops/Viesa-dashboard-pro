import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleConfig, exchangeCode } from "@/lib/google";

/**
 * OAuth-callback: wisselt de code in voor tokens en bewaart de refresh_token
 * server-side in de integraties-tabel (dienst 'gmail'). Nooit in de client.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const site = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/koppelingen?fout=geen_code", site));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", site));

  const cfg = googleConfig();
  if (!cfg) {
    return NextResponse.redirect(new URL("/koppelingen?fout=geen_config", site));
  }

  // `state` bepaalt welke dienst we verbinden: Gmail (standaard) of Drive.
  const dienst = url.searchParams.get("state") === "drive" ? "google_drive" : "gmail";

  try {
    const tokens = await exchangeCode(cfg, code);
    const config = { refresh_token: tokens.refresh_token ?? null };
    if (dienst === "google_drive") {
      await supabase.from("integraties").upsert(
        {
          dienst: "google_drive",
          status: "verbonden",
          config,
          laatst_gecontroleerd_op: new Date().toISOString(),
        },
        { onConflict: "dienst" },
      );
    } else {
      await supabase
        .from("integraties")
        .update({
          status: "verbonden",
          config,
          laatst_gecontroleerd_op: new Date().toISOString(),
        })
        .eq("dienst", "gmail");
    }
  } catch {
    return NextResponse.redirect(new URL("/koppelingen?fout=token", site));
  }

  const param = dienst === "google_drive" ? "drive=verbonden" : "gmail=verbonden";
  return NextResponse.redirect(new URL(`/koppelingen?${param}`, site));
}
