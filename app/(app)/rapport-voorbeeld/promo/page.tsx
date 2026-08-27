import { PaginaKop } from "@/components/ui/PaginaKop";
import { standaardPromoVelden } from "@/lib/mail/promo-tegels";
import { tegelOpzet } from "@/lib/mail/tegel-opzet";
import {
  AFSPRAAK_URL,
  whatsappLinkAlgemeen,
  logoUrlVoorMail,
} from "@/lib/rapport/contact";

/**
 * De promomail met de dienstentegels, gevuld met de standaardtekst — om te
 * kunnen kijken hoe hij eruitziet zonder het verzendvenster te openen.
 *
 * In de browser bewegen de vignetten zoals ze bij een ontvanger met Apple
 * Mail of iPhone bewegen; Gmail en Outlook tonen hetzelfde tafereel
 * stilstaand. Wat je hier dus controleert is vooral het stilstaande beeld —
 * dat is wat de meeste ontvangers krijgen — plus de drie dingen die aan
 * omgevingsvariabelen hangen: logo, agenda-link en WhatsApp-nummer.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Promomail — voorbeeld",
};

export default function PromoMailVoorbeeld() {
  const logo = logoUrlVoorMail();
  const mail = tegelOpzet(standaardPromoVelden("Voorbeeld Webshop"));

  return (
    <>
      <PaginaKop
        titel="Promomail met tegels"
        omschrijving="De landingspagina in één mail, met bewerkbare tekst. Dit is de standaardversie; versturen en personaliseren gaat via Mail → Promomail."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Regel label="Logo" waarde={logo} />
        <Regel
          label="Afspraakknop"
          waarde={AFSPRAAK_URL || "geen agenda ingesteld — de knop wordt een mailtje"}
        />
        <Regel
          label="WhatsApp"
          waarde={whatsappLinkAlgemeen() ?? "geen nummer ingesteld — knop verdwijnt"}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        <p className="truncate border-b border-navy/10 bg-navy/[0.03] px-4 py-2.5 text-sm font-medium text-navy">
          {mail.onderwerp}
        </p>
        <iframe
          title="De promomail met tegels"
          srcDoc={mail.html}
          sandbox=""
          className="h-[78vh] w-full border-0 bg-white"
        />
      </section>
    </>
  );
}

function Regel({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-navy/10 bg-white px-3 py-2">
      <p className="text-xs font-medium text-navy/45">{label}</p>
      <p className="mt-0.5 break-all font-mono text-xs text-navy/70">{waarde}</p>
    </div>
  );
}
