"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Lightbulb, ListPlus, Loader2, Reply } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { MailTriage as Triage } from "@/lib/ai/mailtriage";
import { triageMailAgent, maakTaakVanMail } from "./acties";

const CAT_TOON: Record<Triage["categorie"], "groen" | "amber" | "blauw" | "paars" | "grijs"> = {
  lead: "groen",
  factuur: "amber",
  support: "blauw",
  sollicitatie: "paars",
  overig: "grijs",
};
const URG_TOON: Record<Triage["urgentie"], "rood" | "amber" | "grijs"> = {
  hoog: "rood",
  middel: "amber",
  laag: "grijs",
};

/**
 * Mail-triage-paneel (#4) in het leesvenster. Eén knop classificeert de mail,
 * vat 'm samen en schrijft een concept-antwoord. Veilig: de agent verstuurt of
 * verplaatst niets — je kopieert, beantwoordt of maakt een taak zelf.
 */
export function MailTriage({
  emailId,
  van,
  onderwerp,
}: {
  emailId: string;
  van: string | null;
  onderwerp: string | null;
}) {
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [t, setT] = useState<Triage | null>(null);
  const [concept, setConcept] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [taakGemaakt, setTaakGemaakt] = useState(false);

  async function analyseer() {
    setLaden(true);
    setFout(null);
    setTaakGemaakt(false);
    try {
      const res = await triageMailAgent(emailId);
      if (!res.ok || !res.triage) setFout(res.fout ?? "Er ging iets mis.");
      else {
        setT(res.triage);
        setConcept(res.triage.concept_antwoord);
      }
    } catch (e) {
      setFout(e instanceof Error ? e.message : "Er ging iets mis.");
    } finally {
      setLaden(false);
    }
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(concept);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 1800);
    } catch {
      /* geen clipboard */
    }
  }

  async function taak() {
    const res = await maakTaakVanMail(t?.actie || `Opvolgen: ${onderwerp ?? "mail"}`);
    if (res.ok) setTaakGemaakt(true);
    else setFout(res.fout ?? "Taak maken mislukt.");
  }

  const antwoordOnderwerp = (onderwerp ?? "").startsWith("Re:") ? onderwerp! : `Re: ${onderwerp ?? ""}`;
  const beantwoordHref = `/mail?nieuw=1&naar=${encodeURIComponent(van ?? "")}&onderwerp=${encodeURIComponent(antwoordOnderwerp)}`;

  return (
    <div className="mt-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-oranje/10 text-oranje">
            <Lightbulb size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy">AI-triage</h2>
            <p className="text-xs text-navy/50">Classificeer, vat samen en schrijf een concept-antwoord.</p>
          </div>
        </div>
        <button
          onClick={analyseer}
          disabled={laden}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {laden ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
          {laden ? "Analyseren…" : t ? "Opnieuw" : "Analyseer deze mail"}
        </button>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>}

      {t && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge toon={CAT_TOON[t.categorie]}>{t.categorie}</Badge>
            <Badge toon={URG_TOON[t.urgentie]}>urgentie: {t.urgentie}</Badge>
          </div>
          <p className="text-sm text-navy/80">{t.samenvatting}</p>
          {t.actie && (
            <p className="rounded-lg bg-navy/[0.03] px-3 py-2 text-sm text-navy/80">
              <span className="font-medium">Aanbevolen actie:</span> {t.actie}
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/50">Concept-antwoord</label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={9}
              className="w-full resize-y rounded-lg border border-navy/15 px-3 py-2 text-sm leading-relaxed text-navy outline-none focus:border-navy"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={kopieer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
            >
              {gekopieerd ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              {gekopieerd ? "Gekopieerd" : "Kopieer antwoord"}
            </button>
            <Link
              href={beantwoordHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
            >
              <Reply size={15} /> Beantwoorden
            </Link>
            <button
              onClick={taak}
              disabled={taakGemaakt}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-70"
            >
              {taakGemaakt ? <Check size={15} className="text-emerald-600" /> : <ListPlus size={15} />}
              {taakGemaakt ? "Taak gemaakt" : "Maak taak"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
