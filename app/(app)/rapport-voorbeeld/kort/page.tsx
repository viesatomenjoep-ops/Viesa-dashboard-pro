import { Samenvatting } from "@/components/rapport/Samenvatting";
import { VOORBEELDRAPPORT } from "@/lib/rapport/voorbeeld";

/**
 * De korte versie van het rapportsjabloon met voorbeelddata — intern, achter
 * de login, om dezelfde reden als het volledige voorbeeld ernaast.
 *
 * Bestaat vooral om de afdrukindeling te kunnen nakijken zonder eerst een
 * echte scan te draaien: de samenvatting hoort op twee vellen te passen, en
 * dat zie je pas als je 'm afdrukt.
 */
export const metadata = {
  title: "Samenvatting — voorbeeld",
};

export default function SamenvattingVoorbeeld() {
  return <Samenvatting rapport={VOORBEELDRAPPORT} volledigUrl="/rapport-voorbeeld" />;
}
