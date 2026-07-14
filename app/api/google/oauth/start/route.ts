import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleConfig, oauthUrl } from "@/lib/google";

/** Start de Google/Gmail OAuth-flow (vereist ingelogde gebruiker). */
export async function GET() {
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
  return NextResponse.redirect(oauthUrl(cfg, "gmail"));
}
