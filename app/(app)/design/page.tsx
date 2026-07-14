import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function DesignPagina() {
  return (
    <>
      <PaginaKop titel="Design-editor" omschrijving="Markdown-editor met live preview en GitHub-sync." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 8."
      />
    </>
  );
}
