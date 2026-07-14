import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function FacturenPagina() {
  return (
    <>
      <PaginaKop titel="Facturen" omschrijving="Inschieten, vervaldatum-bewaking en herinneringen via mail." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 5."
      />
    </>
  );
}
