import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function TakenPagina() {
  return (
    <>
      <PaginaKop titel="Taken" omschrijving="Follow-ups met datum; die van vandaag staan op het dashboard." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 3."
      />
    </>
  );
}
