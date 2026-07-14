"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { githubConfig, leesBestand, schrijfBestand } from "@/lib/github";

/** Autosave: bewaart de inhoud van een design-doc in de database. */
export async function bewaarDesignDoc(id: string, inhoud: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("design_docs")
    .update({ inhoud_markdown: inhoud })
    .eq("id", id);
  return error ? { ok: false, fout: error.message } : { ok: true };
}

/** Commit de huidige inhoud naar /design-systems in de GitHub-repo. */
export async function syncNaarGitHub(id: string) {
  const supabase = createClient();
  const { data: doc } = await supabase
    .from("design_docs")
    .select("*")
    .eq("id", id)
    .single();
  if (!doc) return { ok: false, fout: "Document niet gevonden." };

  const cfg = githubConfig();
  if (!cfg) return { ok: false, fout: "GitHub niet geconfigureerd (GITHUB_TOKEN/GITHUB_REPO)." };

  let sha = doc.github_sha ?? "";
  try {
    const bestaand = await leesBestand(cfg, doc.pad);
    sha = bestaand.sha;
  } catch {
    sha = ""; // bestaat nog niet in de repo → aanmaken
  }

  try {
    const res = await schrijfBestand(
      cfg,
      doc.pad,
      doc.inhoud_markdown,
      sha,
      `docs: ${doc.pad} bijwerken via design-editor`,
    );
    await supabase
      .from("design_docs")
      .update({ github_sha: res.sha, laatst_gesynct_op: new Date().toISOString() })
      .eq("id", id);
    revalidatePath("/design");
    return { ok: true };
  } catch (e) {
    return { ok: false, fout: e instanceof Error ? e.message : "Sync mislukt." };
  }
}
