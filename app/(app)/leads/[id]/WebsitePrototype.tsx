"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutTemplate,
  Loader2,
  MonitorSmartphone,
  Smartphone,
  Trash2,
  Wand2,
} from "lucide-react";
import { genereerWebsitePrototype, laadSjabloonPrototype, verwijderPrototype } from "../acties";

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
 * zouden kunnen bouwen". Twee paden naast elkaar:
 *  - Sjabloon (standaard): direct, 0 tokens, gebaseerd op het branchethema.
 *  - AI: maatwerk op basis van de bestaande website, kost een klein aantal
 *    tokens (getoond na afloop) — voor als het sjabloon niet specifiek genoeg is.
 *
 * Elke generatie wordt bewaard (website_prototypes) — hieronder staat een
 * lijst van eerdere prototypes van deze lead, aan te klikken om terug te zien.
 */
export function WebsitePrototype({
  leadId,
  standaardUrl,
  opgeslagen,
}: {
  leadId: string;
  standaardUrl: string;
  opgeslagen: OpgeslagenPrototype[];
}) {
  const router = useRouter();
  const [type, setType] = useState<Type>("website");
  const [url, setUrl] = useState(standaardUrl);
  const [bezig, setBezig] = useState<"sjabloon" | "ai" | null>(null);
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [weergaveType, setWeergaveType] = useState<Type>("website");
  const [tokens, setTokens] = useState<{ in: number; uit: number } | null>(null);

  async function sjabloon() {
    setBezig("sjabloon");
    setFout(null);
    setTokens(null);
    try {
      const res = await laadSjabloonPrototype(leadId, type);
      if (!res.ok) setFout(res.fout ?? "Kon geen sjabloon laden.");
      else {
        setHtml(res.html ?? null);
        setWeergaveType(type);
        router.refresh();
      }
    } finally {
      setBezig(null);
    }
  }

  async function metAi() {
    setBezig("ai");
    setFout(null);
    try {
      const res = await genereerWebsitePrototype(leadId, url, type);
      if (!res.ok) setFout(res.fout);
      else {
        setHtml(res.html);
        setWeergaveType(type);
        setTokens({ in: res.tokensIn, uit: res.tokensUit });
        router.refresh();
      }
    } finally {
      setBezig(null);
    }
  }

  function bekijk(p: OpgeslagenPrototype) {
    setHtml(p.html);
    setWeergaveType(p.type);
    setTokens(null);
    setFout(null);
  }

  async function verwijder(id: string) {
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
            Laat zien hoe een vernieuwde website (of app) er voor deze klant uit zou kunnen zien.
          </p>
        </div>
      </div>

      {/* Website of app */}
      <div className="mt-4 inline-flex rounded-lg border border-navy/15 p-0.5">
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

      {/* Twee paden */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-navy/10 p-3">
          <p className="text-xs font-medium text-navy">Sjabloon — direct, 0 tokens</p>
          <p className="mt-0.5 text-xs text-navy/50">Gebaseerd op de branche van deze lead.</p>
          <button
            type="button"
            onClick={sjabloon}
            disabled={bezig !== null}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90 disabled:opacity-60"
          >
            {bezig === "sjabloon" ? <Loader2 size={13} className="animate-spin" /> : <LayoutTemplate size={13} />}
            Laad sjabloon
          </button>
        </div>

        <div className="rounded-lg border border-navy/10 p-3">
          <p className="text-xs font-medium text-navy">Met AI — maatwerk op basis van de site</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="huidige-website.nl"
            className="mt-1.5 w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs text-navy outline-none focus:border-navy"
          />
          <button
            type="button"
            onClick={metAi}
            disabled={bezig !== null}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-60"
          >
            {bezig === "ai" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            Genereer met AI
          </button>
        </div>
      </div>

      {fout && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{fout}</p>}

      {tokens && (
        <p className="mt-2 text-xs text-navy/40">
          Tokens gebruikt: {tokens.in} in / {tokens.uit} uit.
        </p>
      )}

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
