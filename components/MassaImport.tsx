"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ImportVeld = { key: string; label: string; synoniemen?: string[] };

function normaliseer(s: string): string {
  return s.toLowerCase().replace(/[\s._-]/g, "");
}

/**
 * Plak een lijst uit Excel (of CSV) met een kopregel. De kolommen worden op
 * naam gekoppeld aan de velden en in één keer geïmporteerd.
 */
export function MassaImport({
  velden,
  importActie,
  titel = "Importeer uit Excel",
}: {
  velden: ImportVeld[];
  importActie: (rijen: Record<string, string>[]) => Promise<{ aantal: number; fout?: string }>;
  titel?: string;
}) {
  const router = useRouter();
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  const { rijen, kolommen } = parse(tekst, velden);

  async function importeer() {
    if (rijen.length === 0) return;
    setBezig(true);
    setMelding(null);
    const res = await importActie(rijen);
    setBezig(false);
    if (res.fout) {
      setMelding(`Fout: ${res.fout}`);
    } else {
      setMelding(`${res.aantal} rijen geïmporteerd.`);
      setTekst("");
      router.refresh();
    }
  }

  return (
    <details className="mb-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-navy">{titel}</summary>
      <p className="mt-2 text-xs text-navy/60">
        Plak rijen uit Excel mét een kopregel. Herkende kolommen:{" "}
        {velden.map((v) => v.label).join(", ")}.
      </p>
      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder={"bedrijf\tstad\temail\n" + "Acme BV\tUtrecht\tinfo@acme.nl"}
        className="mt-3 h-40 w-full rounded-lg border border-navy/20 p-3 font-mono text-xs text-navy outline-none focus:border-navy"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={importeer}
          disabled={bezig || rijen.length === 0}
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-50"
        >
          {bezig ? "Importeren…" : `Importeer ${rijen.length} rijen`}
        </button>
        {kolommen.length > 0 && (
          <span className="text-xs text-navy/50">
            Gekoppelde kolommen: {kolommen.join(", ")}
          </span>
        )}
        {melding && <span className="text-xs text-navy/70">{melding}</span>}
      </div>
    </details>
  );
}

function parse(tekst: string, velden: ImportVeld[]) {
  const lijnen = tekst.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lijnen.length < 2) return { rijen: [], kolommen: [] as string[] };

  const scheider = lijnen[0].includes("\t") ? "\t" : lijnen[0].includes(";") ? ";" : ",";
  const kopjes = lijnen[0].split(scheider).map((h) => normaliseer(h));

  // Koppel elke kolom-index aan een veldkey.
  const koppeling: (string | null)[] = kopjes.map((kop) => {
    const veld = velden.find(
      (v) =>
        normaliseer(v.key) === kop ||
        normaliseer(v.label) === kop ||
        (v.synoniemen ?? []).some((s) => normaliseer(s) === kop),
    );
    return veld ? veld.key : null;
  });
  const kolommen = koppeling.filter(Boolean) as string[];

  const rijen: Record<string, string>[] = [];
  for (let i = 1; i < lijnen.length; i++) {
    const cellen = lijnen[i].split(scheider);
    const rij: Record<string, string> = {};
    koppeling.forEach((key, idx) => {
      if (key) rij[key] = (cellen[idx] ?? "").trim();
    });
    rijen.push(rij);
  }
  return { rijen, kolommen };
}
