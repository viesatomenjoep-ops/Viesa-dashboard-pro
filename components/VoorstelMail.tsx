"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Send, Eye } from "lucide-react";
import { ZoekKies } from "@/components/ZoekKies";

/**
 * Het venster om de voorstelmail te versturen: wat Viesa aanbiedt, in de
 * huisstijl, met één knop om een gratis audit in te plannen.
 *
 * Bewust géén editor. De gewone opsteller ernaast is voor een geschreven
 * bericht; dit is een ontwerp dat als geheel klopt, en waar losse bewerkingen
 * alleen maar schade aan kunnen doen. Wat je hier kiest is de ontvanger, de
 * bedrijfsnaam en of er een Deep Scan bij moet — de rest ligt vast.
 *
 * Het voorbeeld komt van de server en niet uit deze component, langs precies
 * hetzelfde pad als de mail die verstuurd wordt. Een voorbeeld dat anders tot
 * stand komt dan de echte mail is geen voorbeeld maar een gok.
 */

export type VoorstelScan = {
  id: string;
  host: string;
  bedrijf: string | null;
  totaal_score: number | null;
  created_at: string;
  /** Zonder deelsleutel is het rapport niet openbaar te openen. */
  deelsleutel: string | null;
};

export type VoorstelKlant = { bedrijf: string; email: string | null };

export function VoorstelMail({
  verstuurActie,
  voorbeeldActie,
  geconfigureerd,
  klanten = [],
  scans = [],
}: {
  verstuurActie: (formData: FormData) => Promise<void>;
  voorbeeldActie: (invoer: {
    bedrijf?: string | null;
    scanId?: string | null;
  }) => Promise<{ onderwerp: string; html: string }>;
  /** Is er een verzendsleutel ingesteld? Zo niet: alleen voorbeeld tonen. */
  geconfigureerd: boolean;
  klanten?: VoorstelKlant[];
  scans?: VoorstelScan[];
}) {
  const [naar, setNaar] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [scanId, setScanId] = useState("");
  const [voorbeeld, setVoorbeeld] = useState<{ onderwerp: string; html: string } | null>(null);
  const [laadt, startLaden] = useTransition();

  // Het voorbeeld opnieuw ophalen zodra er iets verandert wat de mail raakt.
  // Met een korte pauze, anders vuurt hij bij elke aanslag in het naamveld.
  useEffect(() => {
    const t = window.setTimeout(() => {
      startLaden(async () => {
        try {
          setVoorbeeld(await voorbeeldActie({ bedrijf: bedrijf || null, scanId: scanId || null }));
        } catch {
          setVoorbeeld(null);
        }
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [bedrijf, scanId, voorbeeldActie]);

  const gekozenScan = scans.find((s) => s.id === scanId) ?? null;
  const invoerCls =
    "w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <form action={verstuurActie} className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="rounded-xl border border-navy/10 bg-white p-4">
          <p className="text-sm font-semibold text-navy">Naar wie gaat dit?</p>
          <p className="mt-1 text-xs leading-relaxed text-navy/50">
            De mail zelf ligt vast — alles wat we aanbieden, in onze huisstijl,
            met een knop om een gratis audit in te plannen.
          </p>

          <div className="mt-4 grid gap-3">
            {klanten.length > 0 ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Ontvanger</label>
                <ZoekKies
                  name="naar"
                  type="email"
                  required
                  value={naar}
                  onChange={setNaar}
                  onKies={(o) => {
                    setNaar(o.waarde);
                    if (o.sub) setBedrijf(o.sub);
                  }}
                  opties={klanten
                    .filter((k) => k.email)
                    .map((k) => ({ waarde: k.email!, sub: k.bedrijf }))}
                  placeholder="E-mailadres *"
                  className={invoerCls}
                />
              </div>
            ) : (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Ontvanger</span>
                <input
                  name="naar"
                  type="email"
                  required
                  value={naar}
                  onChange={(e) => setNaar(e.target.value)}
                  placeholder="E-mailadres *"
                  className={invoerCls}
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">
                Bedrijfsnaam <span className="font-normal text-navy/40">— optioneel</span>
              </span>
              <input
                name="bedrijf"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
                placeholder="Zonder naam wordt het 'Goedendag'"
                className={invoerCls}
              />
            </label>

            {scans.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">
                  Deep Scan meesturen <span className="font-normal text-navy/40">— optioneel</span>
                </span>
                <select
                  name="scan_id"
                  value={scanId}
                  onChange={(e) => setScanId(e.target.value)}
                  className={`${invoerCls} min-w-0`}
                >
                  <option value="">Geen scan — alleen het aanbod</option>
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.host} · {s.totaal_score ?? "—"}/100 · {s.created_at.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Het voorbeeld hiernaast toont nog geen scanlinks, want een
                voorbeeld hoort niets te veranderen. Bij het versturen krijgt de
                scan zijn deelsleutel alsnog — dat hier zeggen scheelt de vraag
                waarom het blok ontbreekt. */}
            {gekozenScan && !gekozenScan.deelsleutel && (
              <p className="rounded-lg bg-navy/[0.04] px-3 py-2 text-xs leading-relaxed text-navy/60">
                Deze scan is nog niet gedeeld. Bij het versturen maken we de
                deelbare link automatisch aan; in het voorbeeld hiernaast staat
                het scanblok daarom nog niet.
              </p>
            )}
          </div>

          <div className="mt-4 border-t border-navy/10 pt-4">
            {geconfigureerd ? (
              <button
                type="submit"
                disabled={!naar.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
              >
                <Send size={15} /> Voorstel versturen
              </button>
            ) : (
              <p className="rounded-lg bg-navy/[0.04] px-3 py-2 text-xs text-navy/60">
                Er is nog geen verzendsleutel ingesteld (RESEND_API_KEY). Het
                voorbeeld hiernaast werkt wel.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-navy/50">
          <Eye size={13} />
          Zo komt hij binnen
          {laadt && <Loader2 size={12} className="animate-spin" />}
        </div>

        {voorbeeld ? (
          <div className="overflow-hidden rounded-xl border border-navy/15 bg-white">
            <p className="truncate border-b border-navy/10 bg-navy/[0.03] px-4 py-2.5 text-sm font-medium text-navy">
              {voorbeeld.onderwerp}
            </p>
            {/* In een iframe, met `sandbox` zonder scripts: de mail heeft zijn
                eigen opmaak en die hoort niet met het dashboard te vechten. */}
            <iframe
              title="Voorbeeld van de voorstelmail"
              srcDoc={voorbeeld.html}
              sandbox=""
              className="h-[70vh] w-full border-0 bg-white"
            />
          </div>
        ) : (
          <div className="grid h-64 place-items-center rounded-xl border border-dashed border-navy/15 text-sm text-navy/40">
            {laadt ? "Voorbeeld wordt opgebouwd…" : "Geen voorbeeld beschikbaar."}
          </div>
        )}
      </div>
    </form>
  );
}
