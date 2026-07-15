import { redirect } from "next/navigation";

/**
 * De losse berichtpagina is opgegaan in het 3-paneel-postvak: we sturen door
 * naar /mail met het bericht geselecteerd. Zo blijven oude/gedeelde links werken.
 */
export default function MailDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/mail?sel=${params.id}`);
}
