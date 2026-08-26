import { Voorstel } from "@/components/rapport/Voorstel";

/**
 * Het voorstelsjabloon met voorbeelddata — intern, achter de login, om dezelfde
 * reden als de twee rapportvoorbeelden ernaast: dit is precies wat een prospect
 * te zien krijgt, en dat wil je kunnen nakijken (en afdrukken) zonder eerst een
 * echte scan te draaien.
 */
export const metadata = {
  title: "Voorstel — voorbeeld",
};

export default function VoorstelVoorbeeld() {
  return (
    <Voorstel
      bedrijf="Voorbeeld Webshop"
      host="voorbeeld-webshop.nl"
      score={74}
      rapportUrl="/rapport-voorbeeld"
      korteUrl="/rapport-voorbeeld/kort"
    />
  );
}
