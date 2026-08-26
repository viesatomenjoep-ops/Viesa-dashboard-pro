"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Gauge,
  Globe,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import type { ScanResultaat } from "@/lib/scan";
import type { Bevinding } from "@/lib/geo-analyse";

const MODEL_LABEL: Record<string, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

function oordeelVan(score: number) {
  if (score >= 75) return { label: "Goed zichtbaar", kleur: "text-emerald-600", ring: "stroke-emerald-500" };
  if (score >= 50) return { label: "Matig zichtbaar", kleur: "text-amber-600", ring: "stroke-amber-500" };
  return { label: "Vrijwel onzichtbaar", kleur: "text-red-600", ring: "stroke-red-500" };
}

/** Ronde meter voor het totaalcijfer — leest sneller dan een getal alleen. */
function Meter({ score }: { score: number }) {
  const o = oordeelVan(score);
  const straal = 54;
  const omtrek = 2 * Math.PI * straal;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
        <circle cx="66" cy="66" r={straal} className="fill-none stroke-navy/10" strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={straal}
          className={`fill-none ${o.ring}`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={omtrek}
          strokeDashoffset={omtrek * (1 - score / 100)}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-3xl font-semibold ${o.kleur}`}>{score}</div>
        <div className="text-xs text-navy/50">van 100</div>
      </div>
    </div>
  );
}

function DeelScore({
  label,
  score,
  gewicht,
  icoon: Icoon,
  toelichting,
}: {
  label: string;
  score: number | null;
  gewicht: number;
  icoon: typeof Gauge;
  toelichting: string;
}) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4">
      <div className="flex items-center gap-2 text-navy/60">
        <Icoon size={15} />
        <span className="text-xs font-medium">{label}</span>
        <span className="ml-auto text-xs text-navy/35">{gewicht}%</span>
      </div>
      <div className="mt-1.5 text-2xl font-semibold text-navy">
        {score === null ? <span className="text-base text-navy/30">niet gemeten</span> : score}
      </div>
      <p className="mt-0.5 text-xs text-navy/50">{toelichting}</p>
    </div>
  );
}

function BevindingRij({ b }: { b: Bevinding }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <span className="mt-0.5 shrink-0">
        {b.goed ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : b.ernst === "kritiek" ? (
          <XCircle size={16} className="text-red-500" />
        ) : (
          <AlertTriangle size={16} className="text-amber-500" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium text-navy">{b.titel}</span>
          {!b.goed && b.ernst === "kritiek" && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              blokkerend
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-navy/60">{b.uitleg}</p>
        {!b.goed && <p className="mt-1 text-xs text-navy/80">→ {b.advies}</p>}
      </div>
    </li>
  );
}

/**
 * Websitescanner: één URL erin, één oordeel eruit.
 *
 * De niche is optioneel. Laat je hem leeg, dan leidt de server hem af uit de
 * pagina zelf — dat scheelt een veld en is bijna altijd raak.
 */
export function WebsiteScanner({ beginUrl = "" }: { beginUrl?: string }) {
  const [url, setUrl] = useState(beginUrl);
  const [niche, setNiche] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [res, setRes] = useState<(ScanResultaat & { audit_id?: string | null }) | null>(null);

  async function scan() {
    if (!url.trim()) return;
    setBezig(true);
    setFout(null);
    setRes(null);
    try {
      const r = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), niche: niche.trim() || undefined }),
      });
      const data = await r.json();
      if (!r.ok) setFout(data.fout ?? "De scan is mislukt.");
      else setRes(data);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "De scan is mislukt.");
    } finally {
      setBezig(false);
    }
  }

  const gemist = res?.geo.bevindingen.filter((b) => !b.goed) ?? [];
  const gehaald = res?.geo.bevindingen.filter((b) => b.goed) ?? [];

  return (
    <div className="space-y-6">
      {/* Invoer */}
      <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
            <Globe size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">Website scannen</h2>
            <p className="mt-0.5 text-sm text-navy/60">
              Plak een URL. We kijken of AI-modellen het bedrijf noemen, of de site
              leesbaar is voor die modellen, en hoe hij technisch presteert.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Website</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !bezig && scan()}
              placeholder="viesa-automations.nl"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">
              Niche <span className="font-normal text-navy/40">— optioneel</span>
            </span>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !bezig && scan()}
              placeholder="leiden we af uit de site"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={scan}
          disabled={bezig || !url.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
        >
          {bezig ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Scannen…
            </>
          ) : (
            <>
              <Search size={16} /> Scan starten
            </>
          )}
        </button>
        {bezig && (
          <p className="mt-2 text-xs text-navy/40">
            Vier modellen en een snelheidsmeting — reken op een minuut.
          </p>
        )}

        {fout && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>
        )}
      </section>

      {res && (
        <>
          {/* Totaaloordeel */}
          <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <Meter score={res.totaalScore} />
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-semibold ${oordeelVan(res.totaalScore).kleur}`}>
                  {oordeelVan(res.totaalScore).label}
                </p>
                <p className="mt-0.5 truncate text-sm text-navy/70">{res.host}</p>
                {res.paginatitel && (
                  <p className="mt-0.5 truncate text-xs text-navy/40">{res.paginatitel}</p>
                )}
                {res.niche && (
                  <p className="mt-2 text-xs text-navy/50">
                    Gemeten op niche: <span className="text-navy/70">{res.niche}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DeelScore
                label="AI-zichtbaarheid"
                score={res.zichtbaarheid.score}
                gewicht={40}
                icoon={Bot}
                toelichting={
                  res.zichtbaarheid.getest > 0
                    ? `${res.zichtbaarheid.gevonden} van ${res.zichtbaarheid.getest} modellen noemt dit bedrijf`
                    : "geen niche of geen model bereikbaar"
                }
              />
              <DeelScore
                label="GEO-gereedheid"
                score={res.geo.score}
                gewicht={35}
                icoon={Search}
                toelichting={`${gemist.length} van de ${res.geo.bevindingen.length} punten nog te verbeteren`}
              />
              <DeelScore
                label="Techniek"
                score={res.techniek.score}
                gewicht={25}
                icoon={Gauge}
                toelichting={
                  res.techniek.scores.lcp !== null
                    ? `laadt in ${res.techniek.scores.lcp} s op mobiel`
                    : "PageSpeed Insights"
                }
              />
            </div>

            {res.waarschuwingen.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {res.waarschuwingen.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy/60">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Per model */}
          {res.zichtbaarheid.resultaten && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-navy">Wat de modellen zeggen</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(res.zichtbaarheid.resultaten).map(([key, m]) => (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 ${
                      !m.success
                        ? "border-navy/10 bg-navy/[0.02]"
                        : m.target_found
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-navy">{MODEL_LABEL[key] ?? key}</p>
                    <p
                      className={`mt-1 text-xs ${
                        !m.success
                          ? "text-navy/50"
                          : m.target_found
                            ? "text-emerald-700"
                            : "text-red-700"
                      }`}
                    >
                      {!m.success
                        ? (m.error ?? "Geen antwoord")
                        : m.target_found
                          ? "Noemt dit bedrijf"
                          : "Noemt dit bedrijf niet"}
                    </p>
                    {m.success && m.competitors.length > 0 && (
                      <p className="mt-2 text-xs text-navy/45">
                        Noemt wel: {m.competitors.slice(0, 3).map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Wat er te verbeteren valt */}
          <section>
            <h3 className="mb-2 text-sm font-medium text-navy">
              Te verbeteren
              {gemist.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {gemist.length}
                </span>
              )}
            </h3>
            <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
              {gemist.length === 0 ? (
                <p className="px-5 py-4 text-sm text-navy/50">
                  Alle gecontroleerde punten staan goed.
                </p>
              ) : (
                <ul className="divide-y divide-navy/5">
                  {gemist.map((b, i) => (
                    <BevindingRij key={i} b={b} />
                  ))}
                </ul>
              )}
            </div>
          </section>

          {gehaald.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-navy">Wat al goed staat</h3>
              <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
                <ul className="divide-y divide-navy/5">
                  {gehaald.map((b, i) => (
                    <BevindingRij key={i} b={b} />
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
