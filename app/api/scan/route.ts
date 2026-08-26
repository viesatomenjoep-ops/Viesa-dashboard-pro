import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { vraagAlleModellen } from "@/lib/audit-modellen";
import type { AuditResultaten } from "@/lib/audit";
import {
  analyseerGeo,
  haalSite,
  meetPagespeed,
  normaliseerUrl,
  techniekScore,
  totaalScore,
  type ScanResultaat,
} from "@/lib/scan";

/**
 * Websitescanner: plak een URL, krijg één oordeel.
 *
 * Drie metingen die parallel lopen zodra de pagina binnen is:
 *   - GEO-gereedheid  — uit de HTML en robots.txt, gratis
 *   - Techniek        — PageSpeed Insights
 *   - AI-zichtbaarheid — de vier modellen (alleen met een niche)
 *
 * De niche wordt afgeleid uit de pagina zelf als je hem niet opgeeft. Dat scheelt
 * de gebruiker een veld en is bijna altijd raak: de meta-omschrijving zegt
 * precies wat een bedrijf doet.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });

  let body: { url?: string; niche?: string; met_zichtbaarheid?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldige JSON." }, { status: 400 });
  }

  const url = normaliseerUrl(String(body.url ?? ""));
  if (!url) return NextResponse.json({ fout: "Vul een URL in." }, { status: 400 });

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return NextResponse.json({ fout: "Dat is geen geldige URL." }, { status: 400 });
  }

  // 1. De site ophalen. Lukt dit niet, dan is er niets te meten — en dat is
  //    zelf een bevinding: wat wij niet kunnen ophalen, kan een crawler ook niet.
  let site: Awaited<ReturnType<typeof haalSite>>;
  try {
    site = await haalSite(url);
  } catch (e) {
    return NextResponse.json(
      { fout: e instanceof Error ? e.message : "De site is niet bereikbaar." },
      { status: 502 },
    );
  }

  const geo = analyseerGeo({
    html: site.html,
    robotsTxt: site.robotsTxt,
    llmsTxtGevonden: site.llmsTxtGevonden,
  });

  const niche = String(body.niche ?? "").trim() || geo.voorgesteldeNiche;
  const wilZichtbaarheid = body.met_zichtbaarheid !== false && Boolean(niche);

  // 2. Techniek en zichtbaarheid tegelijk — de trage delen naast elkaar.
  type Zichtbaarheid = { resultaten: AuditResultaten | null; fout?: string };

  const zichtbaarheidTaak: Promise<Zichtbaarheid> =
    wilZichtbaarheid && niche
      ? vraagAlleModellen(niche, url)
          .then((r): Zichtbaarheid => ({ resultaten: r }))
          .catch(
            (e): Zichtbaarheid => ({
              resultaten: null,
              fout: e instanceof Error ? e.message : "Zichtbaarheidscheck mislukt.",
            }),
          )
      : Promise.resolve<Zichtbaarheid>({ resultaten: null });

  const [pagespeed, zichtbaarheid] = await Promise.all([
    meetPagespeed(url),
    zichtbaarheidTaak,
  ]);

  const techniek = techniekScore(pagespeed.scores);

  // Zichtbaarheid als cijfer: hoeveel van de modellen die antwoordden noemen het
  // bedrijf. Modellen die uitvielen tellen niet mee — anders straf je de klant
  // voor onze eigen storing.
  let zichtbaarheidScore: number | null = null;
  let gevonden = 0;
  let getest = 0;
  if (zichtbaarheid.resultaten) {
    const modellen = Object.values(zichtbaarheid.resultaten);
    const gelukt = modellen.filter((m) => m.success);
    getest = gelukt.length;
    gevonden = gelukt.filter((m) => m.target_found).length;
    if (getest > 0) zichtbaarheidScore = Math.round((gevonden / getest) * 100);
  }

  const waarschuwingen = [...site.waarschuwingen];
  if (geo.vermoedelijkJsSite) {
    waarschuwingen.push(
      "De pagina bevat nauwelijks tekst in de HTML — vermoedelijk wordt alles met JavaScript ingeladen. " +
        "Dit is wat een AI-crawler óók ziet, dus behandel de lage score als een echte bevinding.",
    );
  }
  if (pagespeed.fout) waarschuwingen.push(pagespeed.fout);
  if (zichtbaarheid.fout) waarschuwingen.push(zichtbaarheid.fout);
  if (!niche) {
    waarschuwingen.push(
      "Geen niche opgegeven en niet af te leiden uit de pagina — de AI-zichtbaarheid is daarom niet gemeten.",
    );
  }

  const resultaat: ScanResultaat = {
    url,
    host,
    niche: niche ?? null,
    paginatitel: geo.paginatitel,
    totaalScore: totaalScore({ zichtbaarheid: zichtbaarheidScore, geo: geo.score, techniek }),
    geo,
    techniek: { score: techniek, scores: pagespeed.scores, fout: pagespeed.fout },
    zichtbaarheid: {
      score: zichtbaarheidScore,
      gevonden,
      getest,
      resultaten: zichtbaarheid.resultaten,
      fout: zichtbaarheid.fout,
    },
    waarschuwingen,
  };

  // 3. Bewaren als audit, zodat de scan terugkomt in de historie en er een PDF
  //    van gemaakt kan worden. Best effort: de klant wacht op het resultaat,
  //    niet op onze administratie.
  let auditId: string | null = null;
  if (zichtbaarheid.resultaten) {
    const { data } = await supabase
      .from("ai_audits")
      .insert({
        user_id: user.id,
        target_url: url,
        niche_keyword: niche ?? host,
        llm_results: zichtbaarheid.resultaten,
      })
      .select("id")
      .single();
    auditId = data?.id ?? null;
  }

  return NextResponse.json({ ...resultaat, audit_id: auditId });
}
