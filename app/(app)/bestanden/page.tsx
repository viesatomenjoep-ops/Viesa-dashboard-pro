import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function BestandenPagina() {
  return (
    <>
      <PaginaKop titel="Bestanden" omschrijving="Uitsluitend Drive-links — nooit bestanden zelf." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 7."
      />
    </>
  );
}
