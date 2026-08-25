"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { standaardSjablonen, type SjabloonType } from "@/lib/sjablonen";

function veld(fd: FormData, key: string): string | null {
  const s = String(fd.get(key) ?? "").trim();
  return s.length ? s : null;
}

/**
 * Herkent de fout die Supabase geeft wanneer migratie 0041 (sjablonen.lettertype)
 * nog niet is gedraaid. We laten het opslaan dan gewoon doorgaan zonder dat veld,
 * in plaats van de gebruiker met een onbegrijpelijke fout op te zadelen.
 */
function kolomOntbreekt(fout: { code?: string; message?: string } | null): boolean {
  if (!fout) return false;
  return (
    fout.code === "PGRST204" ||
    /lettertype/i.test(fout.message ?? "") ||
    /column .* does not exist/i.test(fout.message ?? "")
  );
}

/** Maakt een nieuw sjabloon. */
export async function maakSjabloon(formData: FormData) {
  const naam = String(formData.get("naam") ?? "").trim();
  const type = (String(formData.get("type") ?? "email") || "email") as SjabloonType;
  if (!naam) {
    redirect(`/sjablonen?type=${type}&nieuw=1&fout=` + encodeURIComponent("Naam is verplicht."));
  }
  const supabase = createClient();
  const basis = {
    type,
    naam,
    onderwerp: veld(formData, "onderwerp"),
    inhoud_html: String(formData.get("inhoud_html") ?? ""),
  };
  let { data, error } = await supabase
    .from("sjablonen")
    .insert({ ...basis, lettertype: veld(formData, "lettertype") })
    .select("id")
    .single();
  if (kolomOntbreekt(error)) {
    ({ data, error } = await supabase.from("sjablonen").insert(basis).select("id").single());
  }
  if (error || !data) {
    redirect(`/sjablonen?type=${type}&nieuw=1&fout=` + encodeURIComponent(error?.message ?? "Mislukt."));
  }
  revalidatePath("/sjablonen");
  redirect(`/sjablonen?type=${type}&id=${data.id}&opgeslagen=1`);
}

/** Werkt een bestaand sjabloon bij. */
export async function werkSjabloonBij(id: string, type: SjabloonType, formData: FormData) {
  const supabase = createClient();
  const basis = {
    naam: String(formData.get("naam") ?? "").trim() || "Naamloos",
    onderwerp: veld(formData, "onderwerp"),
    inhoud_html: String(formData.get("inhoud_html") ?? ""),
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabase
    .from("sjablonen")
    .update({ ...basis, lettertype: veld(formData, "lettertype") })
    .eq("id", id);
  if (kolomOntbreekt(error)) {
    ({ error } = await supabase.from("sjablonen").update(basis).eq("id", id));
  }
  if (error) {
    redirect(`/sjablonen?type=${type}&id=${id}&fout=` + encodeURIComponent(error.message));
  }
  revalidatePath("/sjablonen");
  redirect(`/sjablonen?type=${type}&id=${id}&opgeslagen=1`);
}

/** Verwijdert een sjabloon. */
export async function verwijderSjabloon(id: string, type: SjabloonType) {
  const supabase = createClient();
  await supabase.from("sjablonen").delete().eq("id", id);
  revalidatePath("/sjablonen");
  redirect(`/sjablonen?type=${type}`);
}

/** Importeert de standaardsjablonen (idempotent: bestaande naam+type overslaan). */
export async function importeerStandaard() {
  const supabase = createClient();
  const { data: bestaand } = await supabase.from("sjablonen").select("type, naam");
  const set = new Set((bestaand ?? []).map((r) => `${r.type}::${r.naam}`));
  const nieuw = standaardSjablonen().filter((s) => !set.has(`${s.type}::${s.naam}`));
  if (nieuw.length) {
    const { error } = await supabase.from("sjablonen").insert(nieuw);
    // Migratie 0041 nog niet gedraaid: importeer dan zonder het lettertype.
    if (kolomOntbreekt(error)) {
      await supabase
        .from("sjablonen")
        .insert(nieuw.map(({ lettertype: _lettertype, ...rest }) => rest));
    }
  }
  revalidatePath("/sjablonen");
  redirect(`/sjablonen?geimporteerd=${nieuw.length}`);
}
