import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function OffertesPagina() {
  return (
    <>
      <PaginaKop titel="Offertes" omschrijving="Genereren uit templates, status volgen, PDF-link naar Drive." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 4."
      />
    </>
  );
}
