"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Wand2 } from "lucide-react";
import type { Verrijking } from "@/lib/ai/verrijking";
import { stelVerrijkingVoor, pasVerrijkingToe } from "../acties";

/**
 * Lead-verrijkings-paneel (#2). Eén knop laat de agent een score + kwalificatie
 * (branche, grootte, aanbod, openingszin) voorstellen op basis van de lead en
 * zijn website. De gebruiker kiest per veld wat hij overneemt — de agent schrijft
 * nooit zelf.
 */

type VeldKey = "score" | "branche" | "bedrijfsgrootte" | "it_aanbod" | "openingszin";

const VELD_LABEL: Record<VeldKey, string> = {
  score: "Score",
  branche: "Branche",
  bedrijfsgrootte: "Bedrijfsgrootte",
  it_aanbod: "Passend aanbod",
  openingszin: "Openingszin",
};

export function LeadVerrijking({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [laden, setLaden] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState(false);
  const [v, setV] = useState<Verrijking | null>(null);
  const [kies, setKies] = useState<Record<VeldKey, boolean>>({
    score: true,
    branche: true,
    bedrijfsgrootte: true,
    it_aanbod: true,
    openingszin: true,
  });

  async function genereer() {
    setLaden(true);
    setFout(null);
    setKlaar(false);
    try {
      const res = await stelVerrijkingVoor(leadId);
      if (!res.ok || !res.verrijking) setFout(res.fout ?? "Er ging iets mis.");
      else setV(res.verrijking);
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  async function toepassen() {
    if (!v) return;
    setBezig(true);
    setFout(null);
    try {
      const velden: Parameters<typeof pasVerrijkingToe>[1] = {};
      if (kies.score) velden.score = v.score;
      if (kies.branche) velden.branche = v.branche;
      if (kies.bedrijfsgrootte) velden.bedrijfsgrootte = v.bedrijfsgrootte;
      if (kies.it_aanbod) velden.it_aanbod = v.it_aanbod;
      if (kies.openingszin) velden.openingszin = v.openingszin;
      const res = await pasVerrijkingToe(leadId, velden);
      if (!res.ok) setFout(res.fout ?? "Toepassen mislukt.");
      else {
        setKlaar(true);
        router.refresh();
      }
    } finally {
      setBezig(false);
    }
  }

  const waarde: Record<VeldKey, string> = {
    score: v ? String(v.score) : "",
    branche: v?.branche ?? "—",
    bedrijfsgrootte: v?.bedrijfsgrootte ?? "—",
    it_aanbod: v?.it_aanbod ?? "—",
    openingszin: v?.openingszin ?? "—",
  };

  return (
    <div className="mb-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
            <Wand2 size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy">AI-verrijking &amp; score</h2>
            <p className="text-xs text-navy/50">
              De agent leest de lead + website en stelt score en kwalificatie voor.
            </p>
          </div>
        </div>
        <button
          onClick={genereer}
          disabled={laden}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {laden ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {laden ? "Analyseren…" : v ? "Opnieuw" : "Verrijk deze lead"}
        </button>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {v && (
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-4 rounded-lg bg-navy/[0.03] p-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-navy">{v.score}</div>
              <div className="text-[11px] uppercase tracking-wide text-navy/40">score</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-navy/80">{v.samenvatting}</p>
              {v.redenen.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {v.redenen.map((r, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-navy/60">
                      <span className="text-oranje">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(VELD_LABEL) as VeldKey[]).map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-navy/10 p-2.5 hover:bg-navy/[0.02]"
              >
                <input
                  type="checkbox"
                  checked={kies[k]}
                  onChange={(e) => setKies((s) => ({ ...s, [k]: e.target.checked }))}
                  className="mt-0.5 accent-[#1E9E93]"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-navy/40">
                    {VELD_LABEL[k]}
                  </span>
                  <span className="block text-sm text-navy">{waarde[k]}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toepassen}
              disabled={bezig}
              className="inline-flex items-center gap-1.5 rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-60"
            >
              {bezig ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Gekozen toepassen
            </button>
            {klaar && <span className="text-sm text-emerald-700">Toegepast ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
