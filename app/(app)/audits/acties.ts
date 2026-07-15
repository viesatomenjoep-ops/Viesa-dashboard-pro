"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUDIT_SJABLOON, type AuditStatus } from "@/lib/audits";
import type { SupabaseClient } from "@supabase/supabase-js";

async function volgendNummer(supabase: SupabaseClient): Promise<string> {
  const jaar = new Date().getFullYear();
  const { count } = await supabase
    .from("audits")
    .select("*", { count: "exact", head: true })
    .ilike("nummer", `AUD-${jaar}-%`);
  return `AUD-${jaar}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function maakAudit(formData: FormData) {
  const titel = String(formData.get("titel") ?? "").trim() || "Auditverslag";
  const supabase = createClient();
  const nummer = await volgendNummer(supabase);
  const { data, error } = await supabase
    .from("audits")
    .insert({
      nummer,
      titel,
      klant_id: leeg(formData.get("klant_id")),
      inhoud_markdown: AUDIT_SJABLOON,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/audits?fout=" + encodeURIComponent(error?.message ?? "Mislukt."));
  revalidatePath("/audits");
  redirect(`/audits/${data.id}`);
}

export async function werkAuditBij(id: string, formData: FormData) {
  const supabase = createClient();
  await supabase
    .from("audits")
    .update({
      titel: String(formData.get("titel") ?? "").trim() || "Auditverslag",
      inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
    })
    .eq("id", id);
  revalidatePath(`/audits/${id}`);
  revalidatePath("/audits");
  redirect(`/audits/${id}?opgeslagen=1`);
}

export async function wijzigAuditStatus(id: string, status: AuditStatus) {
  const supabase = createClient();
  await supabase.from("audits").update({ status }).eq("id", id);
  revalidatePath(`/audits/${id}`);
  revalidatePath("/audits");
}

export async function verwijderAudit(id: string) {
  const supabase = createClient();
  await supabase.from("audits").delete().eq("id", id);
  revalidatePath("/audits");
  redirect("/audits");
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}
