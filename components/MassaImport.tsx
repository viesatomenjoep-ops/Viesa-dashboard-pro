"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ImportVeld = { key: string; label: string; synoniemen?: string[] };

function normaliseer(s: string): string {
  return s.toLowerCase().replace(/[\s._-]/g, "");
}

/**
 * Importeer een lijst — plak rijen uit Excel/CSV, óf upload een bestand
 * (.csv of .xlsx, ook een naar CSV/Excel geëxporteerde Google Sheet). De
 * kolommen worden op naam aan de velden gekoppeld en in één keer geïmporteerd.
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
  const [bestandRijen, setBestandRijen] = useState<Record<string, string>[] | null>(null);
  const [bestandKolommen, setBestandKolommen] = useState<string[]>([]);
  const [bestandNaam, setBestandNaam] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);

  // Bestand heeft voorrang; anders de geplakte tekst.
  const geplakt = parse(tekst, velden);
  const rijen = bestandRijen ?? geplakt.rijen;
  const kolommen = bestandRijen ? bestandKolommen : geplakt.kolommen;

  async function kiesBestand(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMelding(null);
    try {
      // SheetJS dynamisch laden — leest zowel .csv als .xlsx.
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        blankrows: false,
        defval: "",
        raw: false,
      });
      const { rijen: r, kolommen: k } = koppel(matrix, velden);
      setBestandRijen(r);
      setBestandKolommen(k);
      setBestandNaam(file.name);
      if (r.length === 0) {
        setMelding("Geen herkenbare rijen/kolommen in dit bestand gevonden.");
      }
    } catch (err) {
      setMelding(`Kon bestand niet lezen: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function wisBestand() {
    setBestandRijen(null);
    setBestandKolommen([]);
    setBestandNaam("");
    setMelding(null);
  }

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
      wisBestand();
      router.refresh();
    }
  }

  return (
    <details className="mb-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-navy">{titel}</summary>
      <p className="mt-2 text-xs text-navy/60">
        Upload een bestand (.csv of .xlsx) óf plak rijen mét een kopregel. Herkende
        kolommen: {velden.map((v) => v.label).join(", ")}.
      </p>

      {/* Bestand uploaden */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5">
          Bestand kiezen (.csv/.xlsx)
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={kiesBestand}
            className="hidden"
          />
        </label>
        {bestandNaam && (
          <span className="flex items-center gap-2 text-xs text-navy/70">
            {bestandNaam} · {bestandRijen?.length ?? 0} rijen
            <button
              type="button"
              onClick={wisBestand}
              className="text-navy/40 hover:text-red-500"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {!bestandRijen && (
        <>
          <p className="mt-4 text-xs text-navy/40">of plak hieronder:</p>
          <textarea
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder={"bedrijf\tstad\temail\n" + "Acme BV\tUtrecht\tinfo@acme.nl"}
            className="mt-2 h-40 w-full rounded-lg border border-navy/20 p-3 font-mono text-xs text-navy outline-none focus:border-navy"
          />
        </>
      )}

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

/** Koppelt een matrix (rij 0 = kopjes) aan de velden op naam/synoniem. */
function koppel(matrix: string[][], velden: ImportVeld[]) {
  const dataRijen = matrix.filter((r) => r.some((c) => String(c ?? "").trim().length > 0));
  if (dataRijen.length < 2) return { rijen: [], kolommen: [] as string[] };

  const kopjes = dataRijen[0].map((h) => normaliseer(String(h ?? "")));
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
  for (let i = 1; i < dataRijen.length; i++) {
    const cellen = dataRijen[i];
    const rij: Record<string, string> = {};
    koppeling.forEach((key, idx) => {
      if (key) rij[key] = String(cellen[idx] ?? "").trim();
    });
    // Sla lege rijen over (geen enkel gekoppeld veld gevuld).
    if (Object.values(rij).some((v) => v.length > 0)) rijen.push(rij);
  }
  return { rijen, kolommen };
}

/** Parse geplakte tekst (TSV/CSV/;) naar rijen via dezelfde koppeling. */
function parse(tekst: string, velden: ImportVeld[]) {
  const lijnen = tekst.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lijnen.length < 2) return { rijen: [], kolommen: [] as string[] };
  const scheider = lijnen[0].includes("\t") ? "\t" : lijnen[0].includes(";") ? ";" : ",";
  const matrix = lijnen.map((l) => l.split(scheider));
  return koppel(matrix, velden);
}
