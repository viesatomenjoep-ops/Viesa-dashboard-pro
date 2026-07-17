"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, Trash2, X } from "lucide-react";
import { SwipeRij } from "@/components/ui/SwipeRij";
import type { AgendaItem } from "@/lib/google";

type Item = AgendaItem & { herinneringId?: string; activiteitId?: string };

const TZ = "Europe/Amsterdam";
const WEEKDAGEN = ["M", "D", "W", "D", "V", "Z", "Z"];
const MAANDEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** Stabiele dag-sleutel (YYYY-MM-DD) in NL-tijdzone. */
function dagSleutel(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
}

function sleutelVan(jaar: number, maand0: number, dag: number): string {
  return `${jaar}-${String(maand0 + 1).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
}

/** Maandag = 0 … zondag = 6 (Europese week). */
function weekdagMaandagEerst(jsDag: number): number {
  return (jsDag + 6) % 7;
}

function tijdLabel(it: Item): string {
  if (it.heleDag) return "Hele dag";
  const opt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: TZ };
  const s = new Date(it.start).toLocaleTimeString("nl-NL", opt);
  if (!it.eind) return s;
  const e = new Date(it.eind).toLocaleTimeString("nl-NL", opt);
  return `${s} – ${e}`;
}

/** Kleur per soort item — herinneringen krijgen het accent, afspraken navy/teal. */
function itemKleur(it: Item): string {
  return it.herinneringId ? "bg-oranje" : "bg-blue-500";
}

/**
 * Maandkalender in iPhone-stijl: een maandrooster met gekleurde stipjes op dagen
 * met activiteiten, de dag van vandaag gearceerd, en daaronder de activiteiten
 * van de geselecteerde dag. Toont Google-agenda én eigen herinneringen op één
 * plek, identiek weergegeven.
 */
export function MaandAgenda({
  items,
  vandaagSleutel,
  verwijderHerinnering,
  verwijderActiviteit,
}: {
  items: Item[];
  vandaagSleutel: string;
  verwijderHerinnering: (id: string) => Promise<void>;
  verwijderActiviteit?: (id: string) => Promise<void>;
}) {
  const [jaar, setJaar] = useState(() => Number(vandaagSleutel.slice(0, 4)));
  const [maand0, setMaand0] = useState(() => Number(vandaagSleutel.slice(5, 7)) - 1);
  const [gekozen, setGekozen] = useState(vandaagSleutel);
  const [detail, setDetail] = useState<Item | null>(null);
  const [gemonteerd, setGemonteerd] = useState(false);

  useEffect(() => setGemonteerd(true), []);
  useEffect(() => {
    if (!detail) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", h);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", h);
    };
  }, [detail]);

  async function verwijder(it: Item) {
    if (!window.confirm("Weet u zeker dat u dit wilt verwijderen?")) return;
    if (it.herinneringId) await verwijderHerinnering(it.herinneringId);
    else if (it.activiteitId && verwijderActiviteit) await verwijderActiviteit(it.activiteitId);
    setDetail(null);
  }
  const teVerwijderen = (it: Item) => Boolean(it.herinneringId || (it.activiteitId && verwijderActiviteit));

  // Items groeperen per dag-sleutel.
  const perDag = new Map<string, Item[]>();
  for (const it of items) {
    const k = dagSleutel(it.start);
    if (!perDag.has(k)) perDag.set(k, []);
    perDag.get(k)!.push(it);
  }

  const eersteWeekdag = weekdagMaandagEerst(new Date(jaar, maand0, 1).getDay());
  const dagenInMaand = new Date(jaar, maand0 + 1, 0).getDate();

  // Cellen: lege plekken vooraan + de dagen van de maand.
  const cellen: (number | null)[] = [];
  for (let i = 0; i < eersteWeekdag; i++) cellen.push(null);
  for (let d = 1; d <= dagenInMaand; d++) cellen.push(d);
  while (cellen.length % 7 !== 0) cellen.push(null);

  function verplaatsMaand(richting: -1 | 1) {
    let m = maand0 + richting;
    let j = jaar;
    if (m < 0) { m = 11; j -= 1; }
    if (m > 11) { m = 0; j += 1; }
    setMaand0(m);
    setJaar(j);
  }

  const gekozenItems = (perDag.get(gekozen) ?? []).slice().sort((a, b) => a.start.localeCompare(b.start));
  const gekozenDatum = new Date(`${gekozen}T00:00:00`);
  const gekozenKop = gekozenDatum.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

  return (
    <div className="rounded-2xl border border-navy/10 bg-white shadow-sm">
      {/* Kop: maand + jaar met navigatie */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold capitalize text-navy">
          {MAANDEN[maand0]} <span className="text-navy/40">{jaar}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => verplaatsMaand(-1)}
            aria-label="Vorige maand"
            className="rounded-lg p-2 text-navy hover:bg-navy/5"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => { setJaar(Number(vandaagSleutel.slice(0, 4))); setMaand0(Number(vandaagSleutel.slice(5, 7)) - 1); setGekozen(vandaagSleutel); }}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-oranje hover:bg-oranje/10"
          >
            Vandaag
          </button>
          <button
            type="button"
            onClick={() => verplaatsMaand(1)}
            aria-label="Volgende maand"
            className="rounded-lg p-2 text-navy hover:bg-navy/5"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekdagen */}
      <div className="grid grid-cols-7 border-y border-navy/10 px-2 py-2 text-center text-xs font-medium text-navy/40 sm:px-3">
        {WEEKDAGEN.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      {/* Dagen */}
      <div className="grid grid-cols-7 gap-y-1 px-2 py-2 sm:px-3">
        {cellen.map((d, i) => {
          if (d === null) return <div key={i} />;
          const sleutel = sleutelVan(jaar, maand0, d);
          const dagItems = perDag.get(sleutel) ?? [];
          const isVandaag = sleutel === vandaagSleutel;
          const isGekozen = sleutel === gekozen;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setGekozen(sleutel)}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                  isVandaag
                    ? "bg-oranje text-white"
                    : isGekozen
                      ? "bg-navy text-white"
                      : "text-navy"
                }`}
              >
                {d}
              </span>
              <span className="flex h-1.5 items-center gap-0.5">
                {dagItems.slice(0, 3).map((it, j) => (
                  <span key={j} className={`h-1.5 w-1.5 rounded-full ${itemKleur(it)}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Activiteiten van de gekozen dag */}
      <div className="border-t border-navy/10 p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold capitalize text-navy">{gekozenKop}</p>
        {gekozenItems.length === 0 ? (
          <p className="text-sm text-navy/40">Geen activiteiten op deze dag.</p>
        ) : (
          <ul className="space-y-2">
            {gekozenItems.map((it) => {
              const rij = (
                <button
                  type="button"
                  onClick={() => setDetail(it)}
                  className="flex w-full items-start gap-3 bg-achtergrond p-3 text-left"
                >
                  <span className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${itemKleur(it)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{it.titel}</p>
                    {it.locatie && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-navy/50">
                        <MapPin size={12} className="shrink-0" /> {it.locatie}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-navy/60">
                    {tijdLabel(it)}
                  </span>
                </button>
              );
              return (
                <li key={it.id} className="rounded-xl border border-navy/10">
                  {teVerwijderen(it) ? (
                    <SwipeRij onVerwijder={() => verwijder(it)}>{rij}</SwipeRij>
                  ) : (
                    rij
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail van een activiteit/herinnering — vol scherm met kruisje. */}
      {detail &&
        gemonteerd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-achtergrond">
            <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 sm:px-6">
              <h2 className="truncate text-lg font-semibold text-navy">
                {detail.herinneringId ? "Herinnering" : "Activiteit"}
              </h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Sluiten"
                className="rounded-lg border border-navy/20 p-2 text-navy hover:bg-navy/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-xl space-y-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-12 w-1.5 shrink-0 rounded-full ${itemKleur(detail)}`} />
                  <h1 className="text-xl font-semibold text-navy">{detail.titel}</h1>
                </div>
                <div className="space-y-2 rounded-xl border border-navy/10 bg-white p-4 text-sm">
                  <p className="flex items-center gap-2 text-navy">
                    <CalendarClock size={16} className="shrink-0 text-navy/50" />
                    {new Date(detail.start).toLocaleDateString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: TZ,
                    })}{" "}
                    · {tijdLabel(detail)}
                  </p>
                  {detail.locatie && (
                    <p className="flex items-center gap-2 text-navy">
                      <MapPin size={16} className="shrink-0 text-navy/50" /> {detail.locatie}
                    </p>
                  )}
                  {detail.link && (
                    <a
                      href={detail.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-medium text-oranje hover:underline"
                    >
                      Openen ↗
                    </a>
                  )}
                </div>
                {teVerwijderen(detail) && (
                  <button
                    type="button"
                    onClick={() => verwijder(detail)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} /> Verwijderen
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
