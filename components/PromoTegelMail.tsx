"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Send, Eye, RotateCcw } from "lucide-react";
import { ZoekKies } from "@/components/ZoekKies";
import { DIENSTEN } from "@/lib/aanbod";
import { standaardPromoVelden, type PromoVelden } from "@/lib/mail/promo-tegels";

/**
 * Het venster voor de promomail met de dienstentegels: de landingspagina in
 * één mail, en — anders dan bij de voorstelmail — met tekst die je zelf
 * bijwerkt voordat hij de deur uit gaat.
 *
 * Wat bewerkbaar is: onderwerp, aanhef, intro, afsluiting, en welke diensten
 * als tegel meegaan. Wat vastligt: de tegels zelf, de knoppen, de voettekst —
 * het ontwerp. Zo kun je personaliseren zonder de opmaak te kunnen slopen.
 *
 * Onderwerp en aanhef schrijven zichzelf zolang je er niet aan gezeten hebt:
 * kies je een klant, dan staat zijn naam er meteen in. Heb je er wél in
 * getypt, dan blijven ze van jou — een veld dat je invoer overschrijft omdat
 * je een ontvanger kiest, is precies het soort editor dat je leert wantrouwen.
 *
 * Het voorbeeld komt van de server, langs hetzelfde pad als de echte mail.
 */
export function PromoTegelMail({
  verstuurActie,
  voorbeeldActie,
  geconfigureerd,
  klanten = [],
}: {
  verstuurActie: (formData: FormData) => Promise<void>;
  voorbeeldActie: (velden: PromoVelden) => Promise<{ onderwerp: string; html: string }>;
  /** Is er een verzendsleutel ingesteld? Zo niet: alleen voorbeeld tonen. */
  geconfigureerd: boolean;
  klanten?: { bedrijf: string; email: string | null }[];
}) {
  const start = standaardPromoVelden(null);
  const [naar, setNaar] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [onderwerp, setOnderwerp] = useState(start.onderwerp);
  const [aanhef, setAanhef] = useState(start.aanhef);
  const [intro, setIntro] = useState(start.intro);
  const [slot, setSlot] = useState(start.slot);
  const [diensten, setDiensten] = useState<string[]>(start.diensten);
  const [voorbeeld, setVoorbeeld] = useState<{ onderwerp: string; html: string } | null>(null);
  const [laadt, startLaden] = useTransition();

  // Zolang er niet met de hand in getypt is, volgen onderwerp en aanhef de
  // gekozen bedrijfsnaam.
  const aangeraakt = useRef({ onderwerp: false, aanhef: false });
  useEffect(() => {
    const std = standaardPromoVelden(bedrijf || null);
    if (!aangeraakt.current.onderwerp) setOnderwerp(std.onderwerp);
    if (!aangeraakt.current.aanhef) setAanhef(std.aanhef);
  }, [bedrijf]);

  // Het voorbeeld opnieuw ophalen zodra er iets verandert wat de mail raakt.
  // Met een korte pauze, anders vuurt hij bij elke aanslag.
  useEffect(() => {
    const t = window.setTimeout(() => {
      startLaden(async () => {
        try {
          setVoorbeeld(await voorbeeldActie({ onderwerp, aanhef, intro, slot, diensten }));
        } catch {
          setVoorbeeld(null);
        }
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [onderwerp, aanhef, intro, slot, diensten, voorbeeldActie]);

  function herstel() {
    const std = standaardPromoVelden(bedrijf || null);
    aangeraakt.current = { onderwerp: false, aanhef: false };
    setOnderwerp(std.onderwerp);
    setAanhef(std.aanhef);
    setIntro(std.intro);
    setSlot(std.slot);
    setDiensten(std.diensten);
  }

  const invoerCls =
    "w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <form action={verstuurActie} className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="rounded-xl border border-navy/10 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-navy">Maak hem persoonlijk</p>
              <p className="mt-1 text-xs leading-relaxed text-navy/50">
                De tegels en knoppen liggen vast; de tekst is van jou.
              </p>
            </div>
            <button
              type="button"
              onClick={herstel}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/15 px-2.5 py-1.5 text-xs font-medium text-navy/70 hover:bg-navy/5"
              title="Alle tekstvelden terug naar de standaardtekst"
            >
              <RotateCcw size={12} /> Standaardtekst
            </button>
          </div>

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
                Bedrijfsnaam <span className="font-normal text-navy/40">— vult onderwerp en aanhef</span>
              </span>
              <input
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
                placeholder="Zonder naam wordt het 'Goedendag'"
                className={invoerCls}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Onderwerp</span>
              <input
                name="onderwerp"
                value={onderwerp}
                onChange={(e) => {
                  aangeraakt.current.onderwerp = true;
                  setOnderwerp(e.target.value);
                }}
                className={invoerCls}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Aanhef</span>
              <input
                name="aanhef"
                required
                value={aanhef}
                onChange={(e) => {
                  aangeraakt.current.aanhef = true;
                  setAanhef(e.target.value);
                }}
                className={invoerCls}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">
                Intro <span className="font-normal text-navy/40">— lege regel = nieuwe alinea</span>
              </span>
              <textarea
                name="intro"
                required
                rows={6}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                className={`${invoerCls} resize-y leading-relaxed`}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">
                Afsluiting <span className="font-normal text-navy/40">— optioneel, boven de knoppen</span>
              </span>
              <textarea
                name="slot"
                rows={2}
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="Bijvoorbeeld: ik bel u er deze week even over."
                className={`${invoerCls} resize-y leading-relaxed`}
              />
            </label>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-navy">
                Diensten in de mail{" "}
                <span className="font-normal text-navy/40">— {diensten.length} van {DIENSTEN.length}</span>
              </legend>
              <div className="grid grid-cols-2 gap-1.5">
                {DIENSTEN.map((d) => {
                  const aan = diensten.includes(d.sleutel);
                  return (
                    <label
                      key={d.sleutel}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium ${
                        aan
                          ? "border-navy/25 bg-navy/[0.04] text-navy"
                          : "border-navy/10 text-navy/45"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="diensten"
                        value={d.sleutel}
                        checked={aan}
                        onChange={(e) =>
                          setDiensten((v) =>
                            e.target.checked
                              ? DIENSTEN.map((x) => x.sleutel).filter(
                                  (s) => v.includes(s) || s === d.sleutel,
                                )
                              : v.filter((s) => s !== d.sleutel),
                          )
                        }
                        className="h-3.5 w-3.5 accent-[#19445B]"
                      />
                      <span className="truncate">{d.naam}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="mt-4 border-t border-navy/10 pt-4">
            {geconfigureerd ? (
              <button
                type="submit"
                disabled={!naar.trim() || !aanhef.trim() || !intro.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
              >
                <Send size={15} /> Promomail versturen
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
          Zo komt hij binnen — de tegels bewegen bij ontvangers met Apple Mail of iPhone
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
              title="Voorbeeld van de promomail"
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
