"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Loader2, MonitorSmartphone, Smartphone, Trash2 } from "lucide-react";
import { laadSjabloonPrototype, verwijderPrototype } from "../acties";
import { SJABLOON_BRANCHES } from "@/lib/website-sjabloon";

type Type = "website" | "app";

export type OpgeslagenPrototype = {
  id: string;
  type: Type;
  bron: "sjabloon" | "ai";
  html: string;
  created_at: string;
};

/**
 * Website/app-prototype voor een lead — verkoopmateriaal: "kijk wat we voor je
 * zouden kunnen bouwen". Puur op branchesjablonen: direct, 0 tokens, en elk
 * sjabloon heeft een eigen ontwerp. (De eerdere AI-variant is bewust
 * verwijderd — die kostte tokens en haalde het niet bij de sjablonen.)
 *
 * Elke generatie wordt bewaard (website_prototypes) — hieronder staat een
 * lijst van eerdere prototypes van deze lead, aan te klikken om terug te zien.
 */
export function WebsitePrototype({
  leadId,
  opgeslagen,
}: {
  leadId: string;
  opgeslagen: OpgeslagenPrototype[];
}) {
  const router = useRouter();
  const [type, setType] = useState<Type>("website");
  const [sjabloonBranche, setSjabloonBranche] = useState("");
  const [bezig, setBezig] = useState(false);
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [weergaveType, setWeergaveType] = useState<Type>("website");

  async function sjabloon() {
    setBezig(true);
    setFout(null);
    try {
      const res = await laadSjabloonPrototype(leadId, type, sjabloonBranche || undefined);
      if (!res.ok) setFout(res.fout ?? "Kon geen sjabloon laden.");
      else {
        setHtml(res.html ?? null);
        setWeergaveType(type);
        router.refresh();
      }
    } finally {
      setBezig(false);
    }
  }

  function bekijk(p: OpgeslagenPrototype) {
    setHtml(p.html);
    setWeergaveType(p.type);
    setFout(null);
  }

  async function verwijder(id: string) {
    if (!window.confirm("Weet u zeker dat u dit prototype wilt verwijderen?")) return;
    setVerwijderBezig(id);
    try {
      const res = await verwijderPrototype(id, leadId);
      if (!res.ok) setFout(res.fout ?? "Verwijderen mislukt.");
      else router.refresh();
    } finally {
      setVerwijderBezig(null);
    }
  }

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
          <LayoutTemplate size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-navy">Website-prototype</h2>
          <p className="text-xs text-navy/50">
            Laat zien hoe een vernieuwde website (of app) er voor deze klant uit zou kunnen zien —
            direct en zonder tokenkosten.
          </p>
        </div>
      </div>

      {/* Keuzes: website of app, en welk branchesjabloon */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-lg border border-navy/15 p-0.5">
          <button
            type="button"
            onClick={() => setType("website")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              type === "website" ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
            }`}
          >
            <MonitorSmartphone size={14} /> Website
          </button>
          <button
            type="button"
            onClick={() => setType("app")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
              type === "app" ? "bg-navy text-white" : "text-navy/60 hover:bg-navy/5"
            }`}
          >
            <Smartphone size={14} /> App
          </button>
        </div>

        <label className="block min-w-[220px] flex-1 sm:max-w-xs">
          <span className="mb-1 block text-xs font-medium text-navy/50">
            Branchesjabloon — elk met een eigen ontwerp
          </span>
          <select
            value={sjabloonBranche}
            onChange={(e) => setSjabloonBranche(e.target.value)}
            className="w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs text-navy outline-none focus:border-navy"
          >
            <option value="">Automatisch (branche van de lead)</option>
            {SJABLOON_BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={sjabloon}
          disabled={bezig}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {bezig ? <Loader2 size={13} className="animate-spin" /> : <LayoutTemplate size={13} />}
          Laad sjabloon
        </button>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fout}</p>}

      {/* Eerder gemaakte prototypes van deze lead */}
      {opgeslagen.length > 0 && (
        <div className="mt-4 border-t border-navy/10 pt-3">
          <p className="mb-2 text-xs font-medium text-navy/50">
            Opgeslagen prototypes ({opgeslagen.length})
          </p>
          <ul className="flex flex-wrap gap-2">
            {opgeslagen.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-1.5 rounded-lg border border-navy/15 bg-navy/[0.02] py-1 pl-2.5 pr-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => bekijk(p)}
                  className="inline-flex items-center gap-1.5 text-navy hover:underline"
                >
                  {p.type === "app" ? <Smartphone size={12} /> : <MonitorSmartphone size={12} />}
                  {p.bron === "ai" ? "AI" : "Sjabloon"} · {p.created_at.slice(0, 10)}
                </button>
                <button
                  type="button"
                  onClick={() => verwijder(p.id)}
                  disabled={verwijderBezig !== null}
                  aria-label="Prototype verwijderen"
                  className="text-navy/30 hover:text-red-600 disabled:opacity-50"
                >
                  {verwijderBezig === p.id ? (
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

      {html && (
        <div className="mt-4 flex justify-center overflow-hidden rounded-xl border border-navy/10 bg-achtergrond p-4">
          <iframe
            title="Prototype"
            srcDoc={html}
            sandbox="allow-same-origin"
            className={weergaveType === "app" ? "h-[640px] w-[340px] rounded-2xl border-0" : "h-[520px] w-full rounded-lg border-0 bg-white"}
          />
        </div>
      )}
    </div>
  );
}
