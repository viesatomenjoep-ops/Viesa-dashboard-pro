import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { msConfig, bewaarUitCode } from "@/lib/microsoft";

/**
 * OAuth2-callback: wisselt de code in voor tokens en bewaart de versleutelde
 * MSAL-cache (access- + refresh-token) server-side in ms_tokens.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  const code = searchParams.get("code");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", site));

  if (!code) {
    return NextResponse.redirect(new URL("/koppelingen?fout=ms_geen_code", site));
  }
  const cfg = msConfig();
  if (!cfg) {
    return NextResponse.redirect(new URL("/koppelingen?fout=ms_config", site));
  }

  try {
    await bewaarUitCode(cfg, code);
  } catch {
    return NextResponse.redirect(new URL("/koppelingen?fout=ms_token", site));
  }
  return NextResponse.redirect(new URL("/koppelingen?outlook=verbonden", site));
}
