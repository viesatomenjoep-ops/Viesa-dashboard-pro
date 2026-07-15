import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { msConfig, authUrl } from "@/lib/microsoft";

/** Start de Microsoft/Outlook OAuth2-flow (vereist ingelogde gebruiker). */
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", site));

  const cfg = msConfig();
  if (!cfg) {
    return NextResponse.redirect(
      new URL("/koppelingen?fout=ms_config", site),
    );
  }

  const url = await authUrl(cfg, "outlook");
  return NextResponse.redirect(url);
}
