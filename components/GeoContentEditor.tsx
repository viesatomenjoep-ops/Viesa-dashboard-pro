"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, Eye, FileText, Loader2, PenLine, Sparkles } from "lucide-react";
import { genereerGeoContent, publiceerGeoPagina } from "@/actions/generate-geo-content";

type Weergave = "bewerken" | "voorbeeld";

/**
 * Schrijft het GEO-artikel en laat het bewerken voordat het de deur uit gaat.
 *
 * Bewust een bewerkbaar tekstveld en geen kant-en-klare publicatie: wat het
 * model schrijft is een sterk concept, maar de klant kent zijn eigen cijfers en
 * kan uitspraken doen die wij niet mogen verzinnen. Eerst lezen, dan pas
 * publiceren.
 */
export function GeoContentEditor({
  beginUrl = "",
  beginBedrijf = "",
  beginNiche = "",
  auditId = null,
}: {
  beginUrl?: string;
  beginBedrijf?: string;
  beginNiche?: string;
  auditId?: string | null;
}) {
  const [url, setUrl] = useState(beginUrl);
  const [bedrijf, setBedrijf] = useState(beginBedrijf);
  const [niche, setNiche] = useState(beginNiche);

  const [content, setContent] = useState("");
  const [paginaId, setPaginaId] = useState<string | null>(null);
  const [gepubliceerd, setGepubliceerd] = useState(false);
  const [weergave, setWeergave] = useState<Weergave>("bewerken");
  const [gekopieerd, setGekopieerd] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function genereer() {
    setFout(null);
    start(async () => {
      const r = await genereerGeoContent({
        target_url: url.trim(),
        company_name: bedrijf.trim(),
        niche_keyword: niche.trim(),
        audit_id: auditId,
      });
      if (r.ok) {
        setContent(r.content);
        setPaginaId(r.id);
        setGepubliceerd(false);
        setWeergave("voorbeeld");
      } else {
        setFout(r.fout);
      }
    });
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(content);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      setFout("Kopiëren lukte niet — selecteer de tekst en kopieer handmatig.");
    }
  }

  function publiceer() {
    if (!paginaId) return;
    start(async () => {
      const r = await publiceerGeoPagina(paginaId);
      if (r.ok) setGepubliceerd(true);
      else setFout(r.fout ?? "Publiceren mislukt.");
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
            <FileText size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy">GEO-artikel schrijven</h2>
            <p className="mt-0.5 text-sm text-navy/60">
              Het artikel waarmee de taalmodellen leren dat dit bedrijf de
              autoriteit is in zijn niche.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Bedrijfsnaam</span>
            <input
              value={bedrijf}
              onChange={(e) => setBedrijf(e.target.value)}
              placeholder="Viesa Automations"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Website</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="viesa-automations.nl"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Niche</span>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="automatisering voor webshops"
              className="w-full rounded-lg border border-navy/20 px-3 py-2.5 text-sm text-navy outline-none focus:border-navy"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={genereer}
          disabled={bezig || !bedrijf.trim() || !niche.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
        >
          {bezig ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Artikel schrijven…
            </>
          ) : (
            <>
              <Sparkles size={16} /> {content ? "Opnieuw genereren" : "Genereer artikel"}
            </>
          )}
        </button>
        {bezig && (
          <p className="mt-2 text-xs text-navy/40">
            Een volledig artikel kost ongeveer een minuut.
          </p>
        )}

        {fout && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fout}</p>
        )}
      </section>

      {content && (
        <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 px-4 py-2">
            <div className="flex">
              {(
                [
                  { key: "bewerken", label: "Bewerken", icoon: PenLine },
                  { key: "voorbeeld", label: "Voorbeeld", icoon: Eye },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setWeergave(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${
                    weergave === t.key
                      ? "border-b-2 border-oranje text-navy"
                      : "text-navy/50 hover:text-navy"
                  }`}
                >
                  <t.icoon size={14} /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-navy/40">
                {content.split(/\s+/).filter(Boolean).length} woorden
              </span>
              <button
                type="button"
                onClick={kopieer}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5"
              >
                {gekopieerd ? (
                  <>
                    <Check size={13} className="text-emerald-600" /> Gekopieerd
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Kopieer markdown
                  </>
                )}
              </button>
              {paginaId && (
                <button
                  type="button"
                  onClick={publiceer}
                  disabled={bezig || gepubliceerd}
                  className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
                >
                  {gepubliceerd ? "Gepubliceerd" : "Markeer als gepubliceerd"}
                </button>
              )}
            </div>
          </div>

          {weergave === "bewerken" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={26}
              spellCheck
              className="w-full resize-y px-5 py-4 font-mono text-sm leading-relaxed text-navy outline-none"
            />
          ) : (
            <div className="prose-viesa max-h-[36rem] overflow-y-auto px-6 py-5 text-navy">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
