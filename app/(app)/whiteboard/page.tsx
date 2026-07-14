import { PaginaKop } from "@/components/ui/PaginaKop";
import { LegeStaat } from "@/components/ui/LegeStaat";

export default function WhiteboardPagina() {
  return (
    <>
      <PaginaKop titel="Whiteboard" omschrijving="Sleepbare sticky notes voor vrij denkwerk." />
      <LegeStaat
        titel="In aanbouw"
        omschrijving="Deze module wordt gebouwd in Fase 9."
      />
    </>
  );
}
