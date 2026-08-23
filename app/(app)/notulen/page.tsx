import { PaginaKop } from "@/components/ui/PaginaKop";
import { NotulenWerkbank } from "./NotulenWerkbank";

export const dynamic = "force-dynamic";

export default function NotulenPagina() {
  return (
    <>
      <PaginaKop
        titel="Notulen"
        omschrijving="Typ of spreek je gespreksnotities in — de AI haalt er taken, agenda-items en follow-ups uit."
      />
      <NotulenWerkbank />
    </>
  );
}
