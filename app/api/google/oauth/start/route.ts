import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DRIVE_SCOPES, googleConfig, oauthUrl } from "@/lib/google";

/**
 * Start de Google OAuth-flow (vereist ingelogde gebruiker). Standaard voor Gmail;
 * met `?dienst=drive` vraagt hij alleen Drive-toegang (administratie-upload) en
 * bewaart de tokens onder de aparte dienst 'google_drive'.
 */
export async function GET(request: Request) {
  // Basis voor eigen redirects: de site-URL, met de huidige origin als terugval
  // (een lege NEXT_PUBLIC_SITE_URL mag de boel niet breken).
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", site));
  }

  const cfg = googleConfig();
  if (!cfg) {
    // Leesbare melding op de koppelingenpagina i.p.v. kale JSON.
    return NextResponse.redirect(
      new URL(
        "/koppelingen?fout=" +
          encodeURIComponent(
            "Google is nog niet geconfigureerd: zet GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en " +
              "GOOGLE_REDIRECT_URI in Vercel (zonder aanhalingstekens of spaties) en redeploy.",
          ),
        site,
      ),
    );
  }

  const dienst = new URL(request.url).searchParams.get("dienst");
  const doel = dienst === "drive" ? oauthUrl(cfg, "drive", DRIVE_SCOPES) : oauthUrl(cfg, "gmail");

  // Valideer de opgebouwde Google-URL; een kapotte waarde in de env geeft anders
  // een onleesbare browserfout ("antwoord heeft onjuiste opmaak").
  try {
    return NextResponse.redirect(new URL(doel));
  } catch {
    return NextResponse.redirect(
      new URL(
        "/koppelingen?fout=" +
          encodeURIComponent(
            "De Google-instellingen zijn ongeldig opgemaakt — controleer GOOGLE_CLIENT_ID en " +
              "GOOGLE_REDIRECT_URI in Vercel en redeploy.",
          ),
        site,
      ),
    );
  }
}
