"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verstuurMail, mailHtml } from "@/lib/resend";

/** Verstuurt een e-mail via Resend en logt 'm in de emails-tabel. */
export async function verstuurBericht(formData: FormData) {
  const naar = String(formData.get("naar") ?? "").trim();
  const onderwerp = String(formData.get("onderwerp") ?? "").trim();
  const tekst = String(formData.get("tekst") ?? "").trim();
  const antwoordNaar = String(formData.get("antwoord_naar") ?? "").trim() || undefined;
  const klantId = String(formData.get("klant_id") ?? "").trim() || null;

  if (!naar || !onderwerp || !tekst) {
    redirect("/mail?fout=" + encodeURIComponent("Vul ontvanger, onderwerp en bericht in."));
  }

  const html = mailHtml(onderwerp, tekst);
  const supabase = createClient();

  try {
    const { id } = await verstuurMail({ naar, onderwerp, html, tekst, antwoordNaar });
    await supabase.from("emails").insert({
      richting: "uitgaand",
      naar,
      onderwerp,
      html,
      tekst,
      status: "verzonden",
      provider_id: id,
      klant_id: klantId,
    });
  } catch (e) {
    redirect(
      "/mail?fout=" +
        encodeURIComponent(e instanceof Error ? e.message : "Versturen mislukt."),
    );
  }

  revalidatePath("/mail");
  redirect("/mail?verzonden=1");
}
