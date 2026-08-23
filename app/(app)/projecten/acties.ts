"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/projecten";
import type { DriveLinkType } from "@/lib/drivelinks";
import { vatProjectSamen, genereerContent, type ContentSoort } from "@/lib/ai/project";

/** Project-agent #8: samenvatting + status-signaal + klant-update. */
export async function vatProjectSamenAgent(projectId: string) {
  const supabase = createClient();
  return vatProjectSamen(supabase, projectId);
}

/** Project-agent #10: content (case-study / social / portfolio) uit het project. */
export async function genereerProjectContent(projectId: string, soort: ContentSoort) {
  const supabase = createClient();
  return genereerContent(supabase, projectId, soort);
}

export async function maakProject(formData: FormData) {
  const naam = String(formData.get("naam") ?? "").trim();
  if (!naam) redirect("/projecten?fout=" + encodeURIComponent("Naam is verplicht."));
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projecten")
    .insert({
      naam,
      omschrijving: leeg(formData.get("omschrijving")),
      klant: leeg(formData.get("klant")),
      klant_id: leeg(formData.get("klant_id")),
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/projecten?fout=" + encodeURIComponent(error?.message ?? "Mislukt."));
  }
  revalidatePath("/projecten");
  redirect(`/projecten/${data.id}`);
}

export async function werkProjectBij(id: string, formData: FormData) {
  const supabase = createClient();
  await supabase
    .from("projecten")
    .update({
      naam: String(formData.get("naam") ?? "").trim(),
      omschrijving: leeg(formData.get("omschrijving")),
      klant: leeg(formData.get("klant")),
      klant_id: leeg(formData.get("klant_id")),
      status: (String(formData.get("status") ?? "actief") || "actief") as ProjectStatus,
    })
    .eq("id", id);
  revalidatePath(`/projecten/${id}`);
  revalidatePath("/projecten");
  redirect(`/projecten/${id}?opgeslagen=1`);
}

export async function verwijderProject(id: string) {
  const supabase = createClient();
  await supabase.from("projecten").delete().eq("id", id);
  revalidatePath("/projecten");
  redirect("/projecten");
}

export async function maakNotitie(projectId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("notities").insert({
    project_id: projectId,
    titel: String(formData.get("titel") ?? "Notitie").trim() || "Notitie",
    inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
  });
  revalidatePath(`/projecten/${projectId}`);
}

export async function verwijderNotitie(id: string, projectId: string) {
  const supabase = createClient();
  await supabase.from("notities").delete().eq("id", id);
  revalidatePath(`/projecten/${projectId}`);
}

export async function voegProjectLinkToe(projectId: string, formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return;
  const supabase = createClient();
  await supabase.from("drive_links").insert({
    titel: String(formData.get("titel") ?? "").trim() || url,
    url,
    type: (String(formData.get("type") ?? "drive") || "drive") as DriveLinkType,
    context_type: "project",
    context_id: projectId,
  });
  revalidatePath(`/projecten/${projectId}`);
}

export async function verwijderProjectLink(id: string, projectId: string) {
  const supabase = createClient();
  await supabase.from("drive_links").delete().eq("id", id);
  revalidatePath(`/projecten/${projectId}`);
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
