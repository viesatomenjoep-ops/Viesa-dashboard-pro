import { ExternalLink, PhoneCall, Sparkles } from "lucide-react";

/**
 * Democonsole voor Fonio (AI-telefonie), zichtbaar op de bellijst zodra er op
 * /koppelingen een demonummer of demo-link is ingevuld.
 *
 * Bedoeld om tijdens een verkoopgesprek meteen te kunnen laten horen wat een
 * AI-telefoniste doet: bel het demonummer en zet de speaker aan, of deel de
 * link. Insluiten in een iframe kan alleen als Fonio dat toestaat — daarom
 * staat dat achter een schakelaar en niet standaard aan.
 */
export function FonioDemo({
  demonummer,
  demoUrl,
  partnerUrl,
  insluiten,
}: {
  demonummer: string | null;
  demoUrl: string | null;
  partnerUrl: string | null;
  insluiten: boolean;
}) {
  return (
    <section className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium text-navy">
            <Sparkles size={15} /> Fonio-demo
          </h2>
          <p className="mt-0.5 text-xs text-navy/50">
            Laat live horen wat een AI-telefoniste doet — bel het demonummer en zet
            de speaker aan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {demonummer && (
            <a
              href={`tel:${demonummer.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy/90"
            >
              <PhoneCall size={15} /> Demo bellen
            </a>
          )}
          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
            >
              <ExternalLink size={15} /> Demo openen
            </a>
          )}
          {partnerUrl && (
            <a
              href={partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-navy/50 hover:underline"
            >
              Partnerportaal
            </a>
          )}
        </div>
      </div>

      {insluiten && demoUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-navy/10">
          <iframe
            src={demoUrl}
            title="Fonio-demo"
            className="h-[28rem] w-full"
            allow="microphone"
          />
        </div>
      )}
    </section>
  );
}
