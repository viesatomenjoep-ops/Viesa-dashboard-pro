"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe,
  Loader2,
  Lock,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Bevinding } from "@/lib/geo-analyse";
import type { ScanRapport } from "@/lib/scan";
import { ZoekKies } from "@/components/ZoekKies";
import { pushScanRapportNaarLead } from "@/app/(app)/leads/acties";
import { deelScan, laadOpgeslagenScan, verwijderScan } from "@/app/(app)/scan/acties";

/**
 * Websitescanner: één URL erin, en de controles komen er live één voor één
 * uit — in plaats van twee minuten naar een spinner te staren en dan alles
 * tegelijk te zien.
 *
 * De volgorde van STAPPEN is exact de volgorde waarin de server ze uitvoert
 * (zie app/api/scan/stream/route.ts): eerst wat al in de opgehaalde pagina zit
 * en dus meteen klaar is, dan de trage, externe metingen. Zo lopen de eerste
 * regels binnen een seconde vol, en zie je waar het wachten 'm in zit.
 */

const STAPPEN: { key: string; label: string; icoon: typeof Gauge }[] = [
  { key: "ophalen", label: "Pagina ophalen", icoon: Globe },
  { key: "vindbaarheid", label: "Vindbaarheid", icoon: Search },
  { key: "structured_data", label: "Structured data", icoon: FileSearch },
  { key: "content", label: "Content-analyse", icoon: FileSearch },
  { key: "beveiliging", label: "Beveiliging", icoon: ShieldCheck },
  { key: "scripts", label: "Scripts & tracking", icoon: Lock },
  { key: "snelheid", label: "Snelheidsmeting", icoon: Gauge },
  { key: "zichtbaarheid", label: "AI-zichtbaarheid", icoon: Bot },
];

type StapStatus = "wachtend" | "bezig" | "goed" | "aandacht";

type StapState = {
  status: StapStatus;
  samenvatting: string;
  data?: unknown;
};

const MODEL_LABEL: Record<string, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

function beginState(): Record<string, StapState> {
  return Object.fromEntries(
    STAPPEN.map((s) => [s.key, { status: "wachtend" as StapStatus, samenvatting: "" }]),
  );
}

function StapIcoon({ status }: { status: StapStatus }) {
  if (status === "bezig") return <Loader2 size={16} className="animate-spin text-navy/50" />;
  if (status === "goed") return <CheckCircle2 size={16} className="text-emerald-600" />;
  if (status === "aandacht") return <XCircle size={16} className="text-amber-500" />;
  return <Circle size={16} className="text-navy/20" />;
}

function oordeelVan(score: number) {
  if (score >= 75) return { label: "Goed zichtbaar", kleur: "text-emerald-600", ring: "stroke-emerald-500" };
  if (score >= 50) return { label: "Matig zichtbaar", kleur: "text-amber-600", ring: "stroke-amber-500" };
  return { label: "Vrijwel onzichtbaar", kleur: "text-red-600", ring: "stroke-red-500" };
}

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
          className={`fill-none ${o.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
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

export type ScanLead = { id: string; bedrijf: string; website: string | null; branche?: string | null };

export type OpgeslagenScan = {
  id: string;
  url: string;
  host: string;
  niche: string | null;
  totaal_score: number;
  created_at: string;
};

export function WebsiteScanner({
  beginUrl = "",
  leads = [],
  opgeslagenScans = [],
}: {
  beginUrl?: string;
  /** Bestaande leads met een ingevulde website — voor de kieslijst hieronder. */
  leads?: ScanLead[];
  /** Eerder voltooide scans — om terug te openen of te verwijderen. */
  opgeslagenScans?: OpgeslagenScan[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState(beginUrl);
  const [niche, setNiche] = useState("");
  const [leadZoek, setLeadZoek] = useState("");
  const [gekozenLeadId, setGekozenLeadId] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [stappen, setStappen] = useState<Record<string, StapState>>(beginState());
  const [totaal, setTotaal] = useState<{ score: number; oordeel: string } | null>(null);
  const [rapport, setRapport] = useState<ScanRapport | null>(null);
  const [voorbeeld, setVoorbeeld] = useState<string | null>(null);
  const [host, setHost] = useState<string>("");
  const [pushBezig, setPushBezig] = useState(false);
  const [gepusht, setGepusht] = useState(false);
  const [openBezig, setOpenBezig] = useState<string | null>(null);
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null);
  const [deelBezig, setDeelBezig] = useState<string | null>(null);
  const [gekopieerd, setGekopieerd] = useState<string | null>(null);
  /** De zojuist bewaarde scan — om er direct een klantrapport van te openen. */
  const [laatsteScanId, setLaatsteScanId] = useState<string | null>(null);
  const bronRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => bronRef.current?.close();
  }, []);

  function scan() {
    if (!url.trim() || bezig) return;
    bronRef.current?.close();

    setBezig(true);
    setFout(null);
    setStappen(beginState());
    setTotaal(null);
    setRapport(null);
    setGepusht(false);
    setVoorbeeld(null);
    setLaatsteScanId(null);
    try {
      setHost(new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).host);
    } catch {
      setHost(url.trim());
    }

    // EventSource in plaats van fetch + ReadableStream-reader: dat laatste
    // leest Safari/iOS onbetrouwbaar (soms pas na afloop, soms helemaal niet).
    // EventSource is het native mechanisme voor text/event-stream en werkt
    // overal hetzelfde — alleen GET met query-parameters, geen POST-body.
    const params = new URLSearchParams({ url: url.trim() });
    if (niche.trim()) params.set("niche", niche.trim());
    // De bedrijfsnaam komt van de gekozen lead en gaat mee naar de omslag van
    // het klantrapport.
    if (leadZoek.trim()) params.set("bedrijf", leadZoek.trim());
    const bron = new EventSource(`/api/scan/stream?${params}`);
    bronRef.current = bron;

    bron.onmessage = (ev) => {
      let event: ReturnType<typeof JSON.parse>;
      try {
        event = JSON.parse(ev.data);
      } catch {
        return;
      }
      verwerk(event);
      if (event.type === "klaar" || event.type === "fout") {
        bron.close();
        setBezig(false);
        if (event.type === "klaar" && event.scanId) setLaatsteScanId(event.scanId);
        // De scan is net bewaard (website_scans) — de geschiedenis hieronder
        // bijwerken zodat hij er meteen bij staat.
        if (event.type === "klaar") router.refresh();
      }
    };

    bron.onerror = () => {
      // EventSource probeert zelf te reconnecten; bij een écht kapotte
      // verbinding sluiten we 'm en melden we dat, in plaats van te blijven
      // hangen op "Scannen…".
      if (bron.readyState === EventSource.CLOSED) {
        setFout("De verbinding met de scanner viel weg.");
        setBezig(false);
      }
    };
  }

  async function pushNaarLead() {
    if (!gekozenLeadId || !rapport || pushBezig) return;
    setPushBezig(true);
    setFout(null);
    try {
      const res = await pushScanRapportNaarLead(gekozenLeadId, rapport);
      if (res.ok) setGepusht(true);
      else setFout(res.fout ?? "Push naar lead mislukt.");
    } finally {
      setPushBezig(false);
    }
  }

  /**
   * Zet een bewaard rapport rechtstreeks in de weergave — zonder de scan
   * opnieuw te draaien. Bouwt de stappenlijst na uit de al bewaarde
   * bevindingen, in plaats van live gebeurtenissen te volgen.
   */
  function laadRapport(r: ScanRapport) {
    bronRef.current?.close();
    setBezig(false);
    setFout(null);
    setUrl(r.url);
    setNiche(r.niche ?? "");
    setHost(r.host);
    setVoorbeeld(r.voorbeeld ?? null);
    setGepusht(false);
    setGekozenLeadId(null);
    setTotaal({ score: r.totaalScore, oordeel: oordeelVan(r.totaalScore).label });
    setRapport(r);

    const vindbaarheid = r.vindbaarheid as { bevindingen?: Bevinding[] } | undefined;
    const beveiliging = r.beveiliging as { percentage?: number } | undefined;

    setStappen({
      ophalen: { status: "goed", samenvatting: "" },
      vindbaarheid: {
        status: vindbaarheid?.bevindingen?.every((b) => b.goed) ?? true ? "goed" : "aandacht",
        samenvatting: "",
        data: r.vindbaarheid,
      },
      structured_data: {
        status: r.geo.score >= 70 ? "goed" : "aandacht",
        samenvatting: `${r.geo.score}/100`,
        data: r.geo,
      },
      content: { status: "goed", samenvatting: "" },
      beveiliging: {
        status: (beveiliging?.percentage ?? 100) >= 70 ? "goed" : "aandacht",
        samenvatting: "",
        data: r.beveiliging,
      },
      scripts: { status: "goed", samenvatting: "", data: r.scripts },
      snelheid: {
        status: (r.techniek.score ?? 0) >= 70 ? "goed" : "aandacht",
        samenvatting: r.techniek.score !== null ? `${r.techniek.score}/100` : (r.techniek.fout ?? "Niet gemeten"),
        data: r.techniek,
      },
      zichtbaarheid: {
        status: r.zichtbaarheid.score !== null && r.zichtbaarheid.score >= 50 ? "goed" : "aandacht",
        samenvatting:
          r.zichtbaarheid.getest > 0
            ? `${r.zichtbaarheid.gevonden} van ${r.zichtbaarheid.getest} modellen noemt dit bedrijf`
            : "Geen niche gemeten",
        data: r.zichtbaarheid.resultaten,
      },
    });
  }

  async function bekijkOpgeslagenScan(id: string) {
    if (openBezig) return;
    setOpenBezig(id);
    setFout(null);
    try {
      const res = await laadOpgeslagenScan(id);
      if (res.ok && res.rapport) laadRapport(res.rapport);
      else setFout(res.fout ?? "Kon de scan niet laden.");
    } finally {
      setOpenBezig(null);
    }
  }

  /**
   * Maakt (of hergebruikt) het deelbare adres en opent het in een nieuw tabblad.
   * De link belandt ook op het klembord, zodat hij zo in een mail kan.
   */
  async function deelOpgeslagenScan(id: string) {
    if (deelBezig) return;
    setDeelBezig(id);
    setFout(null);
    try {
      const res = await deelScan(id);
      if (!res.ok || !res.url) {
        setFout(res.fout ?? "Kon geen deellink maken.");
        return;
      }
      const volledig = `${window.location.origin}${res.url}`;
      try {
        await navigator.clipboard.writeText(volledig);
        setGekopieerd(id);
        window.setTimeout(() => setGekopieerd(null), 2500);
      } catch {
        // Klembord geweigerd (geen https, of de gebruiker staat het niet toe).
        // Het openen hieronder werkt dan nog steeds.
      }
      window.open(volledig, "_blank", "noopener");
      router.refresh();
    } finally {
      setDeelBezig(null);
    }
  }

  async function verwijderOpgeslagenScan(id: string) {
    if (!window.confirm("Weet u zeker dat u deze scan wilt verwijderen?")) return;
    setVerwijderBezig(id);
    try {
      const res = await verwijderScan(id);
      if (res.ok) router.refresh();
      else setFout(res.fout ?? "Verwijderen mislukt.");
    } finally {
      setVerwijderBezig(null);
    }
  }

  function verwerk(event: {
    type: string;
    stap?: string;
    goed?: boolean;
    samenvatting?: string;
    data?: unknown;
    score?: number;
    oordeel?: string;
    resultaat?: ScanRapport;
    melding?: string;
    scanId?: string | null;
  }) {
    if (event.type === "stap_start" && event.stap) {
      setStappen((v) => ({ ...v, [event.stap!]: { status: "bezig", samenvatting: "" } }));
    } else if (event.type === "stap_klaar" && event.stap) {
      if (event.stap === "voorbeeld") {
        const d = event.data as { voorbeeld?: string | null } | undefined;
        if (d?.voorbeeld) setVoorbeeld(d.voorbeeld);
        return;
      }
      setStappen((v) => ({
        ...v,
        [event.stap!]: {
          status: event.goed ? "goed" : "aandacht",
          samenvatting: event.samenvatting ?? "",
          data: event.data,
        },
      }));
    } else if (event.type === "totaal" && typeof event.score === "number") {
      setTotaal({ score: event.score, oordeel: event.oordeel ?? "" });
      if (event.resultaat) setRapport(event.resultaat);
    } else if (event.type === "fout") {
      setFout(event.melding ?? "De scan is mislukt.");
    }
  }

  // Alle bevindingen uit de stappen die er een teruggaven, samengevoegd voor
  // de "te verbeteren"-lijst onderaan.
  const alleBevindingen: Bevinding[] = [];
  for (const s of STAPPEN) {
    const d = stappen[s.key]?.data as { bevindingen?: Bevinding[] } | undefined;
    if (d?.bevindingen) alleBevindingen.push(...d.bevindingen);
  }
  const gemist = alleBevindingen.filter((b) => !b.goed);
  const gehaald = alleBevindingen.filter((b) => b.goed);

  const zichtbaarheidData = stappen.zichtbaarheid?.data as
    | Record<string, { success: boolean; target_found: boolean; error?: string; competitors: { name: string }[] }>
    | undefined;

  const klaar = Boolean(totaal);

  const leadOpties = leads
    .filter((l) => l.website && l.website.trim())
    .map((l) => ({ waarde: l.bedrijf, sub: l.website!, id: l.id, website: l.website!, branche: l.branche }));

  return (
    <div className="space-y-6">
      {/* Invoer */}
      <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
            <Radar size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">Website scannen</h2>
            <p className="mt-0.5 text-sm text-navy/60">
              Plak een URL, of kies hieronder een bestaande lead. We volgen live mee terwijl elke
              controle binnenkomt.
            </p>
          </div>
        </div>

        {leadOpties.length > 0 && (
          <label className="mt-5 block">
            <span className="mb-1 block text-sm font-medium text-navy">
              Uit een bestaande lead <span className="font-normal text-navy/40">— optioneel</span>
            </span>
            <ZoekKies
              value={leadZoek}
              onChange={setLeadZoek}
              opties={leadOpties}
              onKies={(o) => {
                const gekozen = leadOpties.find((l) => l.waarde === o.waarde && l.sub === o.sub);
                if (gekozen) {
                  setUrl(gekozen.website);
                  if (gekozen.branche) setNiche(gekozen.branche);
                  setLeadZoek(gekozen.waarde);
                  setGekozenLeadId(gekozen.id);
                }
              }}
              placeholder="Zoek op bedrijfsnaam…"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
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
              <Radar size={16} /> Scan starten
            </>
          )}
        </button>

        {fout && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>
        )}

        {opgeslagenScans.length > 0 && (
          <div className="mt-5 border-t border-navy/10 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-navy/50">
              <Clock size={13} /> Eerdere scans ({opgeslagenScans.length})
            </p>
            <ul className="flex flex-wrap gap-2">
              {opgeslagenScans.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-lg border border-navy/15 bg-navy/[0.02] py-1 pl-2.5 pr-1.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => bekijkOpgeslagenScan(s.id)}
                    disabled={openBezig !== null}
                    className="inline-flex items-center gap-1.5 text-navy hover:underline disabled:opacity-50"
                  >
                    {openBezig === s.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span className={`font-semibold ${oordeelVan(s.totaal_score).kleur}`}>
                        {s.totaal_score}
                      </span>
                    )}
                    {s.host} · {s.created_at.slice(0, 10)}
                  </button>
                  <button
                    type="button"
                    onClick={() => deelOpgeslagenScan(s.id)}
                    disabled={deelBezig !== null}
                    aria-label="Klantrapport openen en link kopiëren"
                    title="Klantrapport openen en link kopiëren"
                    className="text-navy/30 hover:text-navy disabled:opacity-50"
                  >
                    {deelBezig === s.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : gekopieerd === s.id ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <ExternalLink size={12} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => verwijderOpgeslagenScan(s.id)}
                    disabled={verwijderBezig !== null}
                    aria-label="Scan verwijderen"
                    className="text-navy/30 hover:text-red-600 disabled:opacity-50"
                  >
                    {verwijderBezig === s.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {(bezig || klaar) && (
        <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            {/* Live stappenlijst */}
            <div>
              <div className="border-b border-navy/10 px-5 py-3">
                <p className="text-sm font-medium text-navy">{host}</p>
                {!klaar && <p className="text-xs text-navy/40">Bezig met scannen…</p>}
              </div>
              <ul className="divide-y divide-navy/5">
                {STAPPEN.map((s) => {
                  const st = stappen[s.key];
                  return (
                    <li key={s.key} className="flex items-center gap-3 px-5 py-3">
                      <StapIcoon status={st.status} />
                      <s.icoon size={14} className="shrink-0 text-navy/30" />
                      <span className="min-w-0 flex-1 truncate text-sm text-navy">{s.label}</span>
                      {st.samenvatting && (
                        <span className="shrink-0 truncate text-xs text-navy/50">{st.samenvatting}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Voorbeeld van de site — de og:image, zoals een gedeelde link 'm toont */}
            <div className="border-t border-navy/10 bg-achtergrond p-4 lg:border-l lg:border-t-0">
              <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-navy/10 bg-navy/[0.03] px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <span className="ml-2 min-w-0 flex-1 truncate rounded bg-navy/5 px-2 py-0.5 text-center text-xs text-navy/40">
                    {host || "…"}
                  </span>
                </div>
                <div className="aspect-video w-full bg-navy/[0.03]">
                  {voorbeeld ? (
                    // eslint-disable-next-line @next/next/no-img-element -- externe og:image van de gescande site
                    <img src={voorbeeld} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-navy/20">
                      <Globe size={32} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {klaar && totaal && (
        <>
          {/* Totaaloordeel */}
          <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <Meter score={totaal.score} />
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-semibold ${oordeelVan(totaal.score).kleur}`}>
                  {oordeelVan(totaal.score).label}
                </p>
                <p className="mt-0.5 truncate text-sm text-navy/70">{host}</p>
              </div>
              {laatsteScanId && (
                <button
                  type="button"
                  onClick={() => deelOpgeslagenScan(laatsteScanId)}
                  disabled={deelBezig !== null}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-60"
                >
                  {deelBezig === laatsteScanId ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ExternalLink size={15} />
                  )}
                  Klantrapport openen
                </button>
              )}
              {gekozenLeadId && (
                <button
                  type="button"
                  onClick={pushNaarLead}
                  disabled={pushBezig || gepusht}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-70 ${
                    gepusht ? "bg-emerald-100 text-emerald-700" : "bg-navy text-white hover:bg-navy/90"
                  }`}
                >
                  {pushBezig ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : gepusht ? (
                    <Check size={15} />
                  ) : (
                    <Send size={15} />
                  )}
                  {gepusht ? "Op de lead gezet" : "Push naar lead"}
                </button>
              )}
            </div>
          </section>

          {/* Per model */}
          {zichtbaarheidData && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-navy">Wat de modellen zeggen</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(zichtbaarheidData).map(([key, m]) => (
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
                        !m.success ? "text-navy/50" : m.target_found ? "text-emerald-700" : "text-red-700"
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

          {/* Te verbeteren */}
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
                <p className="px-5 py-4 text-sm text-navy/50">Alle gecontroleerde punten staan goed.</p>
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
