import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DRIVE_SCOPES, googleConfig, oauthUrl } from "@/lib/google";

/**
 * Start de Google OAuth-flow (vereist ingelogde gebruiker). Standaard voor Gmail;
 * met `?dienst=drive` vraagt hij alleen Drive-toegang (administratie-upload) en
 * bewaart de tokens onder de aparte dienst 'google_drive'.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL));
  }

  const cfg = googleConfig();
  if (!cfg) {
    return NextResponse.json(
      { fout: "Google niet geconfigureerd (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)." },
      { status: 500 },
    );
  }

  const dienst = new URL(request.url).searchParams.get("dienst");
  if (dienst === "drive") {
    return NextResponse.redirect(oauthUrl(cfg, "drive", DRIVE_SCOPES));
  }
  return NextResponse.redirect(oauthUrl(cfg, "gmail"));
}
