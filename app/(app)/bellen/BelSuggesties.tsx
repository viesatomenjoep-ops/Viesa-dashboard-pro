"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Phone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BelSuggestie } from "@/lib/ai/bellijst";
import { stelBellijstSamen, zetSuggestieOpLijst } from "./acties";

const PRIORITEIT_TOON: Record<BelSuggestie["prioriteit"], "rood" | "amber" | "grijs"> = {
  hoog: "rood",
  middel: "amber",
  laag: "grijs",
};

/**
 * AI-paneel op /bellen: één knop laat de bel-lijst-agent voorstellen wie we
 * vandaag moeten bellen. Per suggestie zie je reden + gesprekspunten en zet je
 * 'm met één klik op de bellijst (bevestiging — de agent schrijft nooit zelf).
 */
export function BelSuggesties() {
  const router = useRouter();
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [suggesties, setSuggesties] = useState<BelSuggestie[] | null>(null);
  const [bron, setBron] = useState<"lokaal" | "ai">("lokaal");
  const [bezigMet, startOvergang] = useTransition();
  const [toegevoegd, setToegevoegd] = useState<Set<string>>(new Set());

  async function genereer() {
    setLaden(true);
    setFout(null);
    try {
      const res = await stelBellijstSamen();
      // Een mislukte AI is geen mislukte lijst: de rangschikking wordt dan
      // lokaal berekend. Alleen als er écht niets uitkwam is het een fout.
      if (!res.ok) setFout(res.fout ?? "Er ging iets mis.");
      setSuggesties(res.suggesties);
      setBron(res.bron);
      setToegevoegd(new Set());
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  function opLijst(s: BelSuggestie) {
    startOvergang(async () => {
      const res = await zetSuggestieOpLijst(s.lead_id, s.gesprekspunten);
      if (res.ok) {
        setToegevoegd((v) => new Set(v).add(s.lead_id));
        router.refresh();
      } else {
        setFout(res.fout ?? "Toevoegen mislukt.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy">
              Belsuggesties
              {suggesties && (
                <span className="ml-2 font-normal text-navy/40">
                  {bron === "ai" ? "· met AI-gesprekspunten" : "· berekend uit je eigen cijfers"}
                </span>
              )}
            </h2>
            <p className="text-xs text-navy/50">
              Wie moeten we vandaag bellen? De agent kiest op score, waarde en laatste contact.
            </p>
          </div>
        </div>
        <button
          onClick={genereer}
          disabled={laden}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {laden ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {laden ? "Bezig…" : suggesties ? "Opnieuw" : "Stel bellijst samen"}
        </button>
      </div>

      {fout && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>
      )}

      {suggesties && suggesties.length === 0 && !fout && (
        <p className="mt-3 text-sm text-navy/60">
          Geen belbare leads gevonden (leads hebben een telefoonnummer nodig).
        </p>
      )}

      {suggesties && suggesties.length > 0 && (
        <ul className="mt-4 space-y-3">
          {suggesties.map((s) => {
            const isToe = toegevoegd.has(s.lead_id);
            return (
              <li key={s.lead_id} className="rounded-lg border border-navy/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-navy">{s.bedrijf}</span>
                      <Badge toon={PRIORITEIT_TOON[s.prioriteit]}>{s.prioriteit}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-navy/60">{s.reden}</p>
                  </div>
                  <button
                    onClick={() => opLijst(s)}
                    disabled={isToe || bezigMet}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      isToe
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-oranje text-white hover:bg-oranje/90"
                    } disabled:opacity-70`}
                  >
                    {isToe ? <Check size={15} /> : <Phone size={15} />}
                    {isToe ? "Op lijst" : "Zet op bellijst"}
                  </button>
                </div>
                {s.gesprekspunten.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-navy/5 pt-2">
                    {s.gesprekspunten.map((g, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-navy/70">
                        <span className="text-oranje">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
