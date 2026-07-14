import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function ProjectenPagina() {
  return (
    <>
      <PaginaKop titel="Projecten" omschrijving="Markdown-notities en Drive-links per project." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 6."
      />
    </>
  );
}
