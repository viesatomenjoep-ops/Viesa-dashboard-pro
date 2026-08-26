import { PaginaKop } from "@/components/ui/PaginaKop";
import { promotieMail } from "@/lib/mail/promo-mail";
import { CONTACT_MAIL, AFSPRAAK_URL, whatsappLink, logoUrlVoorMail } from "@/lib/rapport/contact";

/**
 * De voorstelmail met voorbeelddata — om te kunnen kijken hoe hij eruitziet
 * zonder eerst het verzendvenster te openen en een ontvanger te bedenken.
 *
 * Hij staat naast de twee rapportvoorbeelden om dezelfde reden: dit is precies
 * wat een prospect binnenkrijgt, en dat wil je kunnen nakijken. Vooral het logo
 * en de knoppen — die hangen aan omgevingsvariabelen en zijn dus het eerste wat
 * stukgaat na een deploy.
 *
 * In een iframe met `sandbox`, want de mail heeft zijn eigen opmaak en die
 * hoort niet met het dashboard te vechten.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voorstelmail — voorbeeld",
};

export default function VoorstelMailVoorbeeld() {
  const logo = logoUrlVoorMail();
  const mail = promotieMail({
    bedrijf: "Voorbeeld Webshop",
    host: "voorbeeld-webshop.nl",
    rapportUrl: "/rapport-voorbeeld",
    korteUrl: "/rapport-voorbeeld/kort",
    score: 74,
    afspraakUrl: AFSPRAAK_URL || null,
    whatsappUrl: whatsappLink("voorbeeld-webshop.nl"),
    contactMail: CONTACT_MAIL,
    logoUrl: logo,
  });

  return (
    <>
      <PaginaKop
        titel="Voorstelmail"
        omschrijving="Alles wat Viesa aanbiedt, in één mail. Dit is wat een prospect binnenkrijgt via Mail → Voorstel versturen."
      />

      {/* De drie dingen die aan omgevingsvariabelen hangen, uitgeschreven. Zo
          zie je in één blik of een deploy iets heeft omgegooid — een gebroken
          logo in het briefhoofd merk je anders pas bij de ontvanger. */}
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Regel label="Logo" waarde={logo} />
        <Regel
          label="Afspraakknop"
          waarde={AFSPRAAK_URL || "geen agenda ingesteld — de knop wordt een mailtje"}
        />
        <Regel
          label="WhatsApp"
          waarde={whatsappLink("voorbeeld-webshop.nl") ?? "geen nummer ingesteld — knop verdwijnt"}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        <p className="truncate border-b border-navy/10 bg-navy/[0.03] px-4 py-2.5 text-sm font-medium text-navy">
          {mail.onderwerp}
        </p>
        <iframe
          title="De voorstelmail"
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
