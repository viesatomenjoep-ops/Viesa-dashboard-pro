"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { githubConfig, schrijfBestand } from "@/lib/github";

/** Slaat een design-bestand op: commit naar GitHub + cache in design_documenten. */
export async function bewaarDesign(formData: FormData) {
  const pad = String(formData.get("pad") ?? "");
  const sha = String(formData.get("sha") ?? "");
  const inhoud = String(formData.get("inhoud_markdown") ?? "");

  const cfg = githubConfig();
  if (!cfg) {
    redirect(
      `/design?pad=${encodeURIComponent(pad)}&fout=` +
        encodeURIComponent("GitHub-sync niet geconfigureerd (GITHUB_TOKEN/GITHUB_REPO)."),
    );
  }

  let nieuweSha: string;
  try {
    const res = await schrijfBestand(
      cfg,
      pad,
      inhoud,
      sha,
      `docs: design-systems bijwerken (${pad})`,
    );
    nieuweSha = res.sha;
  } catch (e) {
    redirect(
      `/design?pad=${encodeURIComponent(pad)}&fout=` +
        encodeURIComponent(e instanceof Error ? e.message : "Opslaan mislukt."),
    );
  }

  // Cache bijwerken (best effort).
  try {
    const supabase = createClient();
    await supabase
      .from("design_docs")
      .upsert(
        {
          pad,
          inhoud_markdown: inhoud,
          github_sha: nieuweSha,
          laatst_gesynct_op: new Date().toISOString(),
        },
        { onConflict: "pad" },
      );
  } catch {
    // negeren; GitHub is de bron van waarheid
  }

  revalidatePath("/design");
  redirect(`/design?pad=${encodeURIComponent(pad)}&opgeslagen=1`);
}
