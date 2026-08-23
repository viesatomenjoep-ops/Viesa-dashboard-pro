"use client";

import { useRef, useState } from "react";
import { CalendarPlus, Check, ListPlus, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import type { NotulenResultaat } from "@/lib/ai/notulen";
import { verwerkNotulenAgent, maakTakenBulk, maakAgendaItems } from "./acties";

/**
 * Notulen-werkbank (#7). Typ of spreek je gespreksnotities in, laat de agent er
 * taken, agenda-items en follow-ups uit halen, en leg met één klik vast wat je
 * kiest. De agent maakt niets aan zonder jouw bevestiging.
 */
export function NotulenWerkbank() {
  const [tekst, setTekst] = useState("");
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [res, setRes] = useState<NotulenResultaat | null>(null);
  const [luistert, setLuistert] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  // Gekozen items per lijst.
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [fups, setFups] = useState<Set<number>>(new Set());
  const [agenda, setAgenda] = useState<Set<number>>(new Set());

  const recogRef = useRef<any>(null);

  function toggleDicteren() {
    // Web Speech API (Chrome/Safari). Niet overal beschikbaar.
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      setFout("Spraakherkenning wordt niet ondersteund in deze browser.");
      return;
    }
    if (luistert) {
      recogRef.current?.stop();
      setLuistert(false);
      return;
    }
    const r = new SR();
    r.lang = "nl-NL";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e: any) => {
      let stuk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) stuk += e.results[i][0].transcript;
      setTekst((t) => (t ? t + " " : "") + stuk.trim());
    };
    r.onerror = () => setLuistert(false);
    r.onend = () => setLuistert(false);
    recogRef.current = r;
    r.start();
    setLuistert(true);
  }

  async function verwerk() {
    setLaden(true);
    setFout(null);
    setMelding(null);
    try {
      const out = await verwerkNotulenAgent(tekst);
      if (!out.ok || !out.resultaat) {
        setFout(out.fout ?? "Er ging iets mis.");
      } else {
        setRes(out.resultaat);
        setTaken(new Set(out.resultaat.taken.map((_, i) => i)));
        setFups(new Set(out.resultaat.followups.map((_, i) => i)));
        setAgenda(new Set(out.resultaat.agenda.map((_, i) => i)));
      }
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  async function legTakenVast() {
    if (!res) return;
    const gekozen = [
      ...res.taken.filter((_, i) => taken.has(i)),
      ...res.followups.filter((_, i) => fups.has(i)).map((f) => `Opvolgen: ${f}`),
    ];
    const out = await maakTakenBulk(gekozen);
    if (out.ok) setMelding(`${out.aantal} ta${out.aantal === 1 ? "ak" : "ken"} aangemaakt.`);
    else setFout(out.fout ?? "Taken maken mislukt.");
  }

  async function legAgendaVast() {
    if (!res) return;
    const gekozen = res.agenda.filter((_, i) => agenda.has(i));
    const out = await maakAgendaItems(gekozen);
    if (out.ok) setMelding(`${out.aantal} agenda-item(s) toegevoegd.`);
    else setFout(out.fout ?? "Agenda maken mislukt.");
  }

  function wissel(set: Set<number>, zet: (s: Set<number>) => void, i: number) {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    zet(n);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-navy">Notities</label>
          <button
            onClick={toggleDicteren}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              luistert ? "bg-red-100 text-red-700" : "border border-navy/20 text-navy hover:bg-navy/5"
            }`}
          >
            {luistert ? <MicOff size={15} /> : <Mic size={15} />}
            {luistert ? "Stop" : "Inspreken"}
          </button>
        </div>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={8}
          placeholder="Typ of spreek je gespreks-/vergadernotities in…"
          className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm leading-relaxed text-navy outline-none focus:border-navy"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={verwerk}
            disabled={laden || tekst.trim().length < 5}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
          >
            {laden ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {laden ? "Verwerken…" : "Verwerk notities"}
          </button>
          {melding && <span className="text-sm text-emerald-700">{melding}</span>}
        </div>
        {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}
      </div>

      {res && (
        <div className="space-y-4">
          {res.samenvatting && (
            <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-navy/40">Samenvatting</p>
              <p className="mt-1 text-sm leading-relaxed text-navy/90">{res.samenvatting}</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Taken + follow-ups */}
            <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-navy">Taken &amp; follow-ups</h2>
              {res.taken.length === 0 && res.followups.length === 0 ? (
                <p className="text-sm text-navy/50">Geen taken gevonden.</p>
              ) : (
                <ul className="space-y-1.5">
                  {res.taken.map((t, i) => (
                    <Regel key={`t${i}`} aan={taken.has(i)} onToggle={() => wissel(taken, setTaken, i)} tekst={t} />
                  ))}
                  {res.followups.map((f, i) => (
                    <Regel key={`f${i}`} aan={fups.has(i)} onToggle={() => wissel(fups, setFups, i)} tekst={`Opvolgen: ${f}`} />
                  ))}
                </ul>
              )}
              {(res.taken.length > 0 || res.followups.length > 0) && (
                <button
                  onClick={legTakenVast}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  <ListPlus size={15} /> Maak gekozen taken
                </button>
              )}
            </div>

            {/* Agenda */}
            <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-navy">Agenda-items</h2>
              {res.agenda.length === 0 ? (
                <p className="text-sm text-navy/50">Geen afspraken gevonden.</p>
              ) : (
                <ul className="space-y-1.5">
                  {res.agenda.map((a, i) => (
                    <Regel
                      key={`a${i}`}
                      aan={agenda.has(i)}
                      onToggle={() => wissel(agenda, setAgenda, i)}
                      tekst={a.titel}
                      sub={a.datum ?? "geen datum → vandaag"}
                    />
                  ))}
                </ul>
              )}
              {res.agenda.length > 0 && (
                <button
                  onClick={legAgendaVast}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  <CalendarPlus size={15} /> Zet in agenda
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Regel({
  aan,
  onToggle,
  tekst,
  sub,
}: {
  aan: boolean;
  onToggle: () => void;
  tekst: string;
  sub?: string;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-navy/10 p-2 hover:bg-navy/[0.02]">
        <input type="checkbox" checked={aan} onChange={onToggle} className="mt-0.5 accent-[#1E9E93]" />
        <span className="min-w-0">
          <span className="block text-sm text-navy">{tekst}</span>
          {sub && <span className="block text-xs text-navy/40">{sub}</span>}
        </span>
        {aan && <Check size={14} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />}
      </label>
    </li>
  );
}
