import { PaginaKop } from "@/components/ui/PaginaKop";
import { WebsiteScanner } from "@/components/WebsiteScanner";

export const dynamic = "force-dynamic";

/**
 * Websitescanner. Losstaand van /audit: die vraagt om een niche en gaat over
 * zichtbaarheid alleen; deze pagina begint bij de site zelf en telt drie
 * oordelen samen tot één cijfer dat je aan een prospect kunt laten zien.
 */
export default function ScanPagina({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  return (
    <>
      <PaginaKop
        titel="Websitescan"
        omschrijving="Plak een URL en zie in één oordeel hoe zichtbaar dit bedrijf is voor AI-modellen — en wat eraan te doen is."
      />
      <WebsiteScanner beginUrl={searchParams.url ?? ""} />
    </>
  );
}
