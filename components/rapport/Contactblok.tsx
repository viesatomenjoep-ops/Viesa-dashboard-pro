import { CONTACT_MAIL, afspraakDoel, whatsappLink } from "@/lib/rapport/contact";

/**
 * De afsluiter van beide rapporten: één blok, drie manieren om te reageren.
 *
 * De volgorde is de volgorde van drempels. Een afspraak inplannen kost de klant
 * één klik in onze agenda en levert ons het gesprek op — die staat vooraan.
 * WhatsApp daarna, voor wie eerst één vraag wil stellen zonder een half uur vast
 * te leggen. Mail als laatste, want dat werkt altijd maar leidt zelden meteen
 * ergens toe.
 *
 * Alle drie verdwijnen ze vanzelf als ze niet zijn ingesteld: geen agenda-link
 * betekent dat "Plan een gesprek" een mailtje wordt, geen WhatsApp-nummer
 * betekent geen WhatsApp-knop. Een knop die naar niets leidt is erger dan geen
 * knop — zeker in een document dat naar een prospect gaat.
 *
 * Op papier blijven de knoppen staan (een geprint rapport moet ook laten zien
 * hoe je ons bereikt), maar de adressen komen er als leesbare tekst bij: op
 * papier kun je niet klikken.
 */
export function Contactblok({
  host,
  kop,
  lees,
  /** De extra knop links, bijvoorbeeld "Naar het volledige rapport". */
  eerste,
}: {
  host: string;
  kop: string;
  lees: string;
  eerste?: { label: string; href: string } | null;
}) {
  const wa = whatsappLink(host);
  const afspraak = afspraakDoel(host);

  return (
    <div className="rap-stapel" style={{ gap: 16 }}>
      <h2 style={{ color: "var(--zand)" }}>{kop}</h2>
      <p className="rap-lees" style={{ color: "#B9C2D4" }}>
        {lees}
      </p>

      <div className="rap-knoppen">
        <a
          className="rap-knop rap-knop-accent"
          href={afspraak.href}
          {...(afspraak.agenda ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {afspraak.agenda ? <AgendaIcoon /> : null}
          {afspraak.agenda ? "Kies direct een moment" : "Plan een gesprek"}
          <span aria-hidden="true">→</span>
        </a>

        {wa && (
          <a
            className="rap-knop rap-knop-whatsapp"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcoon />
            Liever eerst één vraag? App ons
          </a>
        )}

        {eerste && (
          <a className="rap-knop rap-knop-stil" href={eerste.href}>
            {eerste.label}
          </a>
        )}
      </div>

      {/* Op papier is een knop een plaatje. De adressen horen er dan uitgeschreven
          bij te staan, anders is een geprint rapport een doodlopende weg. */}
      <p className="rap-klein rap-alleen-papier" style={{ color: "#8FA1BD" }}>
        {CONTACT_MAIL}
        {wa && ` · WhatsApp ${wa.replace(/^https:\/\/wa\.me\//, "+").replace(/\?.*$/, "")}`}
        {afspraak.agenda && ` · ${afspraak.href.replace(/^https?:\/\//, "")}`}
      </p>
    </div>
  );
}

/** Een agenda-blaadje. Geen bibliotheek: één pad drukt schoon af. */
function AgendaIcoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

/** Het WhatsApp-logo, als pad — geen externe afbeelding, dus ook goed op papier. */
function WhatsAppIcoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.3-.02-.47-.02-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.47-.28Z" />
    </svg>
  );
}
