import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verstuurMail, mailHtmlRijk } from "@/lib/resend";
import { maakNotificatie } from "@/lib/notificaties";
import { BEDRIJF } from "@/lib/bedrijf";
import { genereerDagbriefing } from "@/lib/ai/dagbriefing";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Ochtend-cron (Vercel): laat de dagbriefing-agent (#6) een geprioriteerde
 * briefing schrijven en levert 'm als notificatie in het dashboard + als e-mail.
 * Beveiligd met CRON_SECRET (Authorization: Bearer … of ?secret=…).
 *
 * LET OP — bewuste uitzondering op de regel "agent stelt voor, mens bevestigt":
 * dit is een geplande ochtend-pushmail (net als /api/cron/dagupdate), dus hij
 * verstuurt autonoom. De mail is puur informatief (samenvatting), doet geen
 * onomkeerbare acties op klantdata en gaat alleen naar de eigen ontvangers.
 * Alle ándere agents leveren concepten die de gebruiker zelf verstuurt/toepast.
 */
const STANDAARD_ONTVANGERS = ["tomvanbien@gmail.com", "contact@viesa-automations.nl"];

/** Zet de platte/markdown-briefing om in eenvoudige, mailveilige HTML. */
function briefingNaarHtml(tekst: string): string {
  return tekst
    .split(/\n{2,}/)
    .map((blok) => {
      const regels = blok.split("\n").map((r) => r.trim()).filter(Boolean);
      const bullets = regels.filter((r) => /^[-•*]\s/.test(r));
      if (bullets.length === regels.length && bullets.length > 0) {
        const li = bullets
          .map((r) => `<li style="margin:4px 0; color:#1e293b; font-size:14px;">${r.replace(/^[-•*]\s/, "")}</li>`)
          .join("");
        return `<ul style="margin:6px 0; padding-left:18px;">${li}</ul>`;
      }
      // Een korte enkele regel eindigend op ':' behandelen we als kopje.
      if (regels.length === 1 && (/[:：]$/.test(regels[0]) || /^#{1,3}\s/.test(regels[0]))) {
        const kop = regels[0].replace(/^#{1,3}\s/, "").replace(/[:：]$/, "");
        return `<h2 style="color:#19445B; font-size:15px; margin:16px 0 4px;">${kop}</h2>`;
      }
      return `<p style="color:#1e293b; font-size:14px; margin:8px 0;">${regels.join("<br>")}</p>`;
    })
    .join("");
}

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

  const supabase = createServiceClient();
  const { ok, titel, briefing, aantal, fout } = await genereerDagbriefing(supabase);
  if (!ok) {
    return NextResponse.json({ fout: fout ?? "Briefing mislukt." }, { status: 500 });
  }

  // 1) Notificatie in het dashboard.
  await maakNotificatie(supabase, {
    type: "info",
    titel,
    tekst: briefing,
    context_type: "dagbriefing",
    link: "/dashboard",
  });

  // 2) E-mail + loggen in het postvak (Verzonden), net als de dagupdate.
  const ontvangers = (process.env.DAGUPDATE_ONTVANGERS ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const naar = ontvangers.length ? ontvangers : STANDAARD_ONTVANGERS;
  const html = mailHtmlRijk(titel, briefingNaarHtml(briefing));

  let providerId: string | null = null;
  try {
    const res = await verstuurMail({ naar, onderwerp: titel, html, tekst: briefing });
    providerId = res.id;
    await supabase.from("emails").insert({
      richting: "uitgaand",
      map: "verzonden",
      van: BEDRIJF.email,
      van_naam: BEDRIJF.naam,
      naar: naar.join(", "),
      onderwerp: titel,
      html,
      tekst: briefing,
      snippet: briefing.replace(/\s+/g, " ").slice(0, 140),
      gelezen: true,
      status: "verzonden",
      provider_id: providerId,
    });
  } catch (e) {
    // E-mail kan falen (geen Resend-config); de notificatie staat er al.
    return NextResponse.json({ ok: true, aantal, mail: false, mailfout: e instanceof Error ? e.message : "mail mislukt" });
  }

  return NextResponse.json({ ok: true, aantal, mail: true, verstuurd_naar: naar });
}
