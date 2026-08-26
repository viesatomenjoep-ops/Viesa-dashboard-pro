"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Radar,
  XCircle,
} from "lucide-react";
import type { AuditResultaten, Concurrent, ModelUitkomst } from "@/lib/audit";
import { AuditPdfKnop } from "./AuditPdfKnop";

/** De vier modellen, met de naam die de prospect herkent. */
const MODELLEN = [
  { key: "openai", label: "ChatGPT", merk: "OpenAI" },
  { key: "anthropic", label: "Claude", merk: "Anthropic" },
  { key: "gemini", label: "Gemini", merk: "Google" },
  { key: "perplexity", label: "Perplexity", merk: "Perplexity" },
] as const;

type ModelSleutel = (typeof MODELLEN)[number]["key"];

export type AuditAntwoord = AuditResultaten & {
  audit_id: string | null;
  target_url: string;
  niche_keyword: string;
  samenvatting: { gelukt: number; gevonden: number; totaal: number };
  opslag_fout?: string;
};

/**
 * Het audit-scherm: invoer, resultaten per model, en de concurrenten die wél
 * genoemd worden.
 *
 * De opzet volgt het gesprek dat je met de prospect voert: eerst de vraag
 * ("word je gevonden?"), dan het antwoord per model, en pas daarna de lijst met
 * wie er in jouw plaats wordt aanbevolen. Die laatste doet het werk.
 */
export function VisibilityAuditView() {
  const zoek = useSearchParams();
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<AuditAntwoord | null>(null);

  // Vanuit de Lead Directory komen url en niche als queryparameters mee.
  useEffect(() => {
    const u = zoek.get("url");
    const n = zoek.get("niche");
    if (u) setUrl(u);
    if (n) setNiche(n);
  }, [zoek]);

  async function startAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !niche.trim()) return;

    setLaden(true);
    setFout(null);
    setResultaat(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_url: url.trim(), niche_keyword: niche.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.fout ?? "De audit is niet gelukt.");
      setResultaat(data as AuditAntwoord);
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  // Concurrenten van alle modellen samen, ontdubbeld op hostnaam, gesorteerd op
  // hoe vaak ze genoemd worden — wie door drie modellen wordt aangeraden, staat
  // sterker dan wie door één wordt genoemd.
  const concurrenten = resultaat ? bundelConcurrenten(resultaat) : [];

  return (
    <div className="space-y-8">
      {/* ---- Sectie 1: invoer ---- */}
      <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
            <Radar size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">AI Visibility Audit</h2>
            <p className="mt-0.5 text-sm text-navy/60">
              Vier taalmodellen krijgen de vraag wie zij aanraden in deze niche.
              We kijken of jouw bedrijf ertussen staat.
            </p>
          </div>
        </div>

        <form onSubmit={startAudit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Bedrijfs-URL</span>
            <div className="relative">
              <Globe
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30"
              />
              <input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="viesa-automations.nl"
                className="w-full rounded-lg border border-navy/20 py-2.5 pl-9 pr-3 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Niche of zoekwoord</span>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30"
              />
              <input
                required
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="automatisering voor webshops in Nederland"
                className="w-full rounded-lg border border-navy/20 py-2.5 pl-9 pr-3 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={laden || !url.trim() || !niche.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
            >
              {laden ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Vier modellen bevragen…
                </>
              ) : (
                <>
                  <Radar size={16} />
                  Start audit
                </>
              )}
            </button>
            {laden && (
              <p className="mt-2 text-xs text-navy/40">
                Dit duurt tot een halve minuut. De modellen draaien tegelijk; valt
                er één uit, dan gaat de rest gewoon door.
              </p>
            )}
          </div>
        </form>

        {fout && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>
        )}
      </section>

      {resultaat && (
        <>
          {/* ---- Sectie 2: per model ---- */}
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-navy">
                  Zichtbaarheid van {hostKort(resultaat.target_url)}
                </h2>
                <p className="text-sm text-navy/60">
                  Gevonden door {resultaat.samenvatting.gevonden} van de{" "}
                  {resultaat.samenvatting.totaal} modellen.
                </p>
              </div>
              <AuditPdfKnop audit={resultaat} concurrenten={concurrenten} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODELLEN.map((m) => (
                <ModelKaart
                  key={m.key}
                  label={m.label}
                  merk={m.merk}
                  uitkomst={resultaat[m.key as ModelSleutel]}
                />
              ))}
            </div>

            {resultaat.opslag_fout && (
              <p className="mt-3 text-xs text-amber-700">
                Let op: de audit is uitgevoerd maar niet opgeslagen ({resultaat.opslag_fout}).
              </p>
            )}
          </section>

          {/* ---- Sectie 3: de concurrenten ---- */}
          <section>
            <h2 className="text-base font-semibold text-navy">
              Wie wél wordt aanbevolen
            </h2>
            <p className="mb-3 text-sm text-navy/60">
              Deze bedrijven noemen de modellen in jouw niche — samen goed voor de
              aandacht die jij misloopt.
            </p>

            {concurrenten.length === 0 ? (
              <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/50">
                Geen concurrenten teruggekregen. Dat gebeurt als alle vier de
                modellen faalden — kijk bij de kaarten hierboven wat er misging.
              </div>
            ) : (
              <ol className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
                {concurrenten.slice(0, 5).map((c, i) => (
                  <li
                    key={`${c.host}-${i}`}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      i > 0 ? "border-t border-navy/5" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/5 text-sm font-semibold text-navy">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{c.name}</p>
                      {c.url && (
                        <a
                          href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 truncate text-xs text-navy/50 hover:text-navy hover:underline"
                        >
                          {c.host || c.url} <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy/70">
                      {c.aantal}× genoemd
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** Eén modelkaart: groen als je gevonden wordt, rood als je genegeerd wordt. */
function ModelKaart({
  label,
  merk,
  uitkomst,
}: {
  label: string;
  merk: string;
  uitkomst: ModelUitkomst;
}) {
  if (!uitkomst.success) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-navy/[0.02] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">{label}</p>
            <p className="text-xs text-navy/40">{merk}</p>
          </div>
          <AlertTriangle size={20} className="text-navy/25" />
        </div>
        <p className="mt-3 text-sm font-medium text-navy/50">Geen antwoord</p>
        <p className="mt-1 line-clamp-2 text-xs text-navy/40">
          {uitkomst.error ?? "Dit model reageerde niet."}
        </p>
      </div>
    );
  }

  const gevonden = uitkomst.target_found;
  return (
    <div
      className={`rounded-2xl border p-5 ${
        gevonden ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="text-xs text-navy/40">{merk}</p>
        </div>
        {gevonden ? (
          <CheckCircle2 size={20} className="text-emerald-600" />
        ) : (
          <XCircle size={20} className="text-red-600" />
        )}
      </div>
      <p
        className={`mt-3 text-sm font-semibold ${
          gevonden ? "text-emerald-800" : "text-red-800"
        }`}
      >
        {gevonden ? "Gevonden" : "Niet gevonden"}
      </p>
      <p className={`mt-0.5 text-xs ${gevonden ? "text-emerald-700" : "text-red-700"}`}>
        {gevonden
          ? "U bent zichtbaar in dit model."
          : "Dit model negeert uw bedrijf."}
      </p>
    </div>
  );
}

export type GebundeldeConcurrent = Concurrent & { host: string; aantal: number };

/**
 * Voegt de lijsten van alle modellen samen, ontdubbeld op hostnaam.
 *
 * Sorteren op het aantal modellen dat een bedrijf noemt is de hele grap: wie
 * door drie van de vier wordt aangeraden, domineert de markt echt — wie door
 * één wordt genoemd, is toeval.
 */
export function bundelConcurrenten(res: AuditResultaten): GebundeldeConcurrent[] {
  const perHost = new Map<string, GebundeldeConcurrent>();

  for (const m of MODELLEN) {
    const uitkomst = res[m.key as ModelSleutel];
    if (!uitkomst?.success) continue;
    for (const c of uitkomst.competitors) {
      const host = kaleHost(c.url) || c.name.toLowerCase().trim();
      if (!host) continue;
      const bestaand = perHost.get(host);
      if (bestaand) {
        bestaand.aantal += 1;
        if (!bestaand.url && c.url) bestaand.url = c.url;
      } else {
        perHost.set(host, { name: c.name || host, url: c.url, host, aantal: 1 });
      }
    }
  }

  return Array.from(perHost.values()).sort(
    (a, b) => b.aantal - a.aantal || a.name.localeCompare(b.name, "nl"),
  );
}

/** Kale hostnaam — zelfde regels als de server, maar dan in de browser. */
function kaleHost(waarde: string): string {
  if (!waarde) return "";
  let s = waarde.trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.split(/[/?#]/)[0];
  s = s.split(":")[0];
  return s.replace(/^www\./, "").replace(/\.$/, "");
}

function hostKort(u: string): string {
  return kaleHost(u) || u;
}
