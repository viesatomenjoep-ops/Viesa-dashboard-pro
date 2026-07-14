import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function LeadsPagina() {
  return (
    <>
      <PaginaKop titel="Leads & pipeline" omschrijving="Prospects met score, signalen en openingszin op een kanban." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 2."
      />
    </>
  );
}
