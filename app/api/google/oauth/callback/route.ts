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
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

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

  try {
    const tokens = await exchangeCode(cfg, code);
    await supabase
      .from("integraties")
      .update({
        status: "verbonden",
        config: { refresh_token: tokens.refresh_token ?? null },
        laatst_gecontroleerd_op: new Date().toISOString(),
      })
      .eq("dienst", "gmail");
  } catch {
    return NextResponse.redirect(new URL("/koppelingen?fout=token", site));
  }

  return NextResponse.redirect(new URL("/koppelingen?gmail=verbonden", site));
}
