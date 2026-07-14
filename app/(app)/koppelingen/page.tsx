import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function KoppelingenPagina() {
  return (
    <>
      <PaginaKop titel="Koppelingen" omschrijving="Drive, Sheets, Docs, Slack, Gmail, Outlook en Claude API." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 10."
      />
    </>
  );
}
