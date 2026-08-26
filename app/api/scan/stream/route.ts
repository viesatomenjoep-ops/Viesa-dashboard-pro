import { createClient } from "@/lib/supabase/server";
import { vraagAlleModellenMetCache } from "@/lib/audit-modellen";
import type { AuditResultaten } from "@/lib/audit";
import {
  analyseerGeo,
  haalSite,
  meetPagespeed,
  normaliseerUrl,
  techniekScore,
  totaalScore,
  type ScanRapport,
} from "@/lib/scan";
import {
  controleerBeveiliging,
  controleerScripts,
  controleerVindbaarheid,
  voorbeeldAfbeelding,
} from "@/lib/site-checks";
import { herkenTechnologie } from "@/lib/rapport/technologie";

/**
 * Streamende websitescan — dezelfde meting als /api/scan, maar dan als een
 * reeks losse gebeurtenissen in plaats van één antwoord na een minuut wachten.
 *
 * Elke controle (snelheid, vindbaarheid, structured data, inhoud,
 * toegankelijkheid, beveiliging, scripts, AI-zichtbaarheid) stuurt een event
 * zodra hij klaar is. De volgorde is bewust: snel en gratis eerst (uit de al
 * opgehaalde pagina), traag en extern laatst (PageSpeed, de vier modellen).
 * Zo ziet de gebruiker binnen een seconde de eerste resultaten binnenkomen,
 * in plaats van naar een spinner te staren terwijl alles achter de schermen al
 * lang klaar is.
 *
 * Server-Sent Events in plaats van een losse POST-per-stap: één verbinding,
 * geen race conditions over de volgorde, en de browser handelt reconnects af.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

type Event =
  | { type: "stap_start"; stap: string }
  | { type: "stap_klaar"; stap: string; goed: boolean; samenvatting: string; data?: unknown }
  | { type: "totaal"; score: number; oordeel: string; resultaat: ScanRapport }
  | { type: "fout"; melding: string }
  | { type: "klaar"; scanId?: string | null };

function sse(event: Event): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// GET in plaats van POST: de browser praat hiermee via EventSource, niet via
// een handmatige fetch + ReadableStream-reader. Reden: Safari/iOS leest een
// gestreamde fetch-response onbetrouwbaar (soms pas na afloop, soms nooit) —
// EventSource is het native, beproefde mechanisme voor precies dit protocol
// (text/event-stream) en werkt overal hetzelfde. Kan dus geen POST-body
// meesturen; url/niche gaan als query-parameters mee.
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(sse({ type: "fout", melding: "Niet ingelogd." }), { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const body = { url: params.get("url") ?? "", niche: params.get("niche") ?? "" };

  const url = normaliseerUrl(String(body.url ?? ""));
  if (!url) {
    return new Response(sse({ type: "fout", melding: "Vul een URL in." }), { status: 400 });
  }
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return new Response(sse({ type: "fout", melding: "Dat is geen geldige URL." }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const begonnenOp = Date.now();
      const stuur = (e: Event) => controller.enqueue(encoder.encode(sse(e)));
      // Voert een stap uit, meldt start en einde, en laat een fout in één stap
      // de rest van de scan niet meeslepen — precies zoals Promise.allSettled
      // dat al doet voor de vier modellen.
      const stap = async <T,>(
        naam: string,
        fn: () => Promise<T>,
        naarEvent: (r: T) => { goed: boolean; samenvatting: string; data?: unknown },
      ): Promise<T | null> => {
        stuur({ type: "stap_start", stap: naam });
        try {
          const r = await fn();
          const e = naarEvent(r);
          stuur({ type: "stap_klaar", stap: naam, ...e });
          return r;
        } catch (err) {
          stuur({
            type: "stap_klaar",
            stap: naam,
            goed: false,
            samenvatting: err instanceof Error ? err.message : "Mislukt.",
          });
          return null;
        }
      };

      try {
        // 1. De site ophalen — alles hierna hangt hiervan af.
        const site = await stap(
          "ophalen",
          () => haalSite(url),
          (s) => ({
            goed: true,
            samenvatting: `${Math.round(s.laadtijdMs)} ms antwoordtijd`,
          }),
        );

        if (!site) {
          stuur({
            type: "fout",
            melding:
              "De pagina is niet op te halen. Mogelijk blokkeert de site geautomatiseerd verkeer — " +
              "dan zien de AI-crawlers dit ook.",
          });
          controller.close();
          return;
        }

        // 2. Alles wat al in huis is, kost niets meer — dus meteen na elkaar.
        const geo = await stap(
          "vindbaarheid",
          async () =>
            controleerVindbaarheid({
              html: site.html,
              robotsTxt: site.robotsTxt,
              sitemapGevonden: site.sitemapGevonden,
            }),
          (r) => ({ goed: r.bevindingen.every((b) => b.goed), samenvatting: r.samenvatting, data: r }),
        );

        const structured = await stap(
          "structured_data",
          async () => analyseerGeo({ html: site.html, robotsTxt: site.robotsTxt, llmsTxtGevonden: site.llmsTxtGevonden }),
          (r) => ({
            goed: r.score >= 70,
            samenvatting: `${r.score}/100 · ${r.bevindingen.filter((b) => b.goed).length} van ${r.bevindingen.length} punten`,
            data: r,
          }),
        );

        const contentWoorden = structured
          ? Math.round(
              (structured.bevindingen.find((b) => b.titel === "Hoeveelheid tekst")?.uitleg.match(/\d+/)?.[0] &&
                Number(structured.bevindingen.find((b) => b.titel === "Hoeveelheid tekst")!.uitleg.match(/\d+/)![0])) ||
                0,
            )
          : 0;
        await stap(
          "content",
          async () => contentWoorden,
          (n) => ({ goed: n >= 300, samenvatting: `${n} woorden geanalyseerd` }),
        );

        const beveiliging = await stap(
          "beveiliging",
          async () => controleerBeveiliging(site.headers, site.https),
          (r) => ({ goed: r.percentage >= 70, samenvatting: r.samenvatting, data: r }),
        );

        const scripts = await stap(
          "scripts",
          async () => controleerScripts(site.html, host),
          (r) => ({ goed: true, samenvatting: r.samenvatting, data: r }),
        );

        const technologie = await stap(
          "technologie",
          async () => herkenTechnologie(site.html, site.headers),
          (groepen) => {
            const n = groepen.reduce((s, g) => s + g.namen.length, 0);
            return {
              goed: true,
              samenvatting: n === 0 ? "Niets herkend" : `${n} herkend`,
              data: groepen,
            };
          },
        );

        // 3. De trage, externe metingen — pas hierna, want ze kosten tijd en
        //    (bij PageSpeed en de modellen) geld.
        const pagespeed = await stap(
          "snelheid",
          () => meetPagespeed(url),
          (r) => ({
            goed: (r.scores.prestatie ?? 0) >= 70,
            samenvatting:
              r.scores.prestatie !== null
                ? `${r.scores.prestatie}/100${r.scores.lcp !== null ? ` · laadt in ${r.scores.lcp}s` : ""}`
                : (r.fout ?? "Niet gemeten"),
            data: r,
          }),
        );

        const niche = String(body.niche ?? "").trim() || structured?.voorgesteldeNiche || null;
        let zichtbaarheid: AuditResultaten | null = null;
        let zichtbaarheidHergebruikt = false;
        if (niche) {
          const uitkomst = await stap(
            "zichtbaarheid",
            () => vraagAlleModellenMetCache(niche, url),
            (r) => {
              const modellen = Object.values(r.resultaten);
              const gelukt = modellen.filter((m) => m.success);
              const gevonden = gelukt.filter((m) => m.target_found).length;
              const basis =
                gelukt.length > 0
                  ? `${gevonden} van ${gelukt.length} modellen noemt dit bedrijf`
                  : "Geen model bereikbaar";
              return {
                goed: gelukt.length > 0 && gevonden === gelukt.length,
                samenvatting: r.hergebruikt ? `${basis} (hergebruikt, geen kosten)` : basis,
                data: r.resultaten,
              };
            },
          );
          zichtbaarheid = uitkomst?.resultaten ?? null;
          zichtbaarheidHergebruikt = uitkomst?.hergebruikt ?? false;
        } else {
          stuur({
            type: "stap_klaar",
            stap: "zichtbaarheid",
            goed: false,
            samenvatting: "Geen niche af te leiden — sla een zoekwoord op om dit te meten.",
          });
        }

        // 4. Alles samentellen.
        const techniek = pagespeed ? techniekScore(pagespeed.scores) : null;
        let zichtbaarheidScore: number | null = null;
        if (zichtbaarheid) {
          const gelukt = Object.values(zichtbaarheid).filter((m) => m.success);
          if (gelukt.length > 0) {
            zichtbaarheidScore = Math.round(
              (gelukt.filter((m) => m.target_found).length / gelukt.length) * 100,
            );
          }
        }
        const score = totaalScore({
          zichtbaarheid: zichtbaarheidScore,
          geo: structured?.score ?? 0,
          techniek,
        });
        const oordeel = score >= 75 ? "Goed zichtbaar" : score >= 50 ? "Matig zichtbaar" : "Vrijwel onzichtbaar";
        const voorbeeld = voorbeeldAfbeelding(site.html, url);

        const waarschuwingen = [...site.waarschuwingen];
        if (zichtbaarheidHergebruikt) {
          waarschuwingen.push(
            "AI-zichtbaarheid hergebruikt van een eerdere meting in dezelfde niche (< 24u oud) — geen nieuwe modelkosten.",
          );
        }

        // Het volledige rapport — dit is wat "push naar lead" en de PDF
        // gebruiken, zonder de scan opnieuw te hoeven draaien.
        const resultaat: ScanRapport = {
          url,
          host,
          niche: niche ?? null,
          paginatitel: structured?.paginatitel ?? null,
          totaalScore: score,
          geo: structured ?? {
            score: 0,
            bevindingen: [],
            voorgesteldeNiche: null,
            paginatitel: null,
            vermoedelijkJsSite: false,
          },
          techniek: {
            score: techniek,
            scores: pagespeed?.scores ?? {
              prestatie: null,
              seo: null,
              toegankelijkheid: null,
              bestPractices: null,
              lcp: null,
            },
            fout: pagespeed?.fout,
          },
          zichtbaarheid: {
            score: zichtbaarheidScore,
            gevonden: zichtbaarheid
              ? Object.values(zichtbaarheid).filter((m) => m.success && m.target_found).length
              : 0,
            getest: zichtbaarheid ? Object.values(zichtbaarheid).filter((m) => m.success).length : 0,
            resultaten: zichtbaarheid,
          },
          waarschuwingen,
          beveiliging,
          scripts,
          vindbaarheid: geo,
          voorbeeld,
          // Alles wat fase 3 nodig heeft om toegankelijkheid, werking en
          // techniek als eigen onderdeel te tonen.
          audits: pagespeed?.audits ?? {},
          lighthouseVersie: pagespeed?.lighthouseVersie ?? null,
          paginas: site.paginas,
          technologie: technologie ?? [],
          rekentijdMs: Date.now() - begonnenOp,
        };

        stuur({ type: "totaal", score, oordeel, resultaat });

        // 5. Bewaren, best effort — de gebruiker wacht op het resultaat, niet
        //    op onze administratie.
        if (zichtbaarheid) {
          await supabase.from("ai_audits").insert({
            user_id: user.id,
            target_url: url,
            niche_keyword: niche ?? host,
            llm_results: zichtbaarheid,
          });
        }

        // Het volledige rapport apart bewaren (los van een lead) zodat /scan
        // een geschiedenis kan tonen om terug te openen of te verwijderen.
        // De id komt mee terug, zodat de scanner meteen een deellink naar het
        // klantrapport kan maken zonder de lijst opnieuw te hoeven ophalen.
        const { data: bewaard } = await supabase
          .from("website_scans")
          .insert({
            url,
            host,
            niche: niche ?? null,
            totaal_score: score,
            rapport: resultaat,
            // De bedrijfsnaam als die is meegegeven; die leest op de omslag van
            // het klantrapport een stuk beter dan een hostnaam.
            bedrijf: params.get("bedrijf")?.trim() || null,
          })
          .select("id")
          .single();

        stuur({ type: "stap_klaar", stap: "voorbeeld", goed: true, samenvatting: "", data: { voorbeeld } });

        stuur({ type: "klaar", scanId: bewaard?.id ?? null });
      } catch (e) {
        stuur({ type: "fout", melding: e instanceof Error ? e.message : "De scan is mislukt." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
