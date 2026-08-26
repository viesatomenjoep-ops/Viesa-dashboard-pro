import { Rapport } from "@/components/rapport/Rapport";
import { VOORBEELDRAPPORT } from "@/lib/rapport/voorbeeld";

/**
 * Het rapportsjabloon met voorbeelddata — intern, achter de login.
 *
 * Bewust nog niet op een openbaar adres: het rapport krijgt in fase 2 een
 * token in de URL, en tot die toegangscontrole er is hoort er niets van dit
 * sjabloon zonder inloggen bereikbaar te zijn.
 *
 * Ook bewust zonder de gebruikelijke PaginaKop: dit moet er precies zo uitzien
 * als wat een klant straks krijgt, inclusief de eigen huisstijl. Alles wat er
 * omheen staat zou dat vertroebelen.
 */
export const metadata = {
  title: "Rapportsjabloon — voorbeeld",
};

export default function RapportVoorbeeld() {
  return <Rapport rapport={VOORBEELDRAPPORT} />;
}
