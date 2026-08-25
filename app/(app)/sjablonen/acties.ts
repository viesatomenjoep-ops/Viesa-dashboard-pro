"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SJABLOON_TYPES, standaardSjablonen, type SjabloonType } from "@/lib/sjablonen";

function veld(fd: FormData, key: string): string | null {
  const s = String(fd.get(key) ?? "").trim();
  return s.length ? s : null;
}

/**
 * Herkent de fout die Supabase geeft wanneer een kolom nog niet bestaat, omdat
 * de bijbehorende migratie nog niet gedraaid is — `lettertype` (0041) of
 * `favoriet` (0043). We slaan dat veld dan over of melden het netjes, in plaats
 * van de gebruiker met een onbegrijpelijke fout op te zadelen.
 */
function kolomOntbreekt(fout: { code?: string; message?: string } | null): boolean {
  if (!fout) return false;
  const bericht = fout.message ?? "";
  return (
    fout.code === "PGRST204" ||
    /\b(lettertype|favoriet)\b/i.test(bericht) ||
    /column .* does not exist/i.test(bericht) ||
    /could not find .* column/i.test(bericht)
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

/**
 * Zet een sjabloon aan of uit als favoriet. Favorieten staan bovenaan in het
 * overzicht én in de sjabloonkiezer van het mailvenster.
 *
 * Geeft een foutmelding terug in plaats van te redirecten, zodat dit ook vanuit
 * het mailvenster aangeroepen kan worden zonder dat je je concept kwijtraakt.
 * Migratie 0043 nog niet gedraaid? Dan zegt hij dat, in plaats van stil te falen.
 */
export async function wisselFavoriet(
  id: string,
  favoriet: boolean,
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("sjablonen")
    .update({ favoriet, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    const fout = kolomOntbreekt(error)
      ? "Favorieten werken pas na migratie 0043 (sjablonen.favoriet)."
      : error.message;
    return { ok: false, fout };
  }

  revalidatePath("/sjablonen");
  revalidatePath("/mail");
  return { ok: true };
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

  // Per type invoegen, niet alles in één keer. Weigert de database één soort —
  // bijvoorbeeld 'belscript' omdat migratie 0040 nog niet gedraaid is — dan
  // komen de andere soorten er wél in, in plaats van dat de hele import stilvalt.
  let toegevoegd = 0;
  const fouten: string[] = [];

  for (const { key: type } of SJABLOON_TYPES) {
    const rijen = nieuw.filter((s) => s.type === type);
    if (!rijen.length) continue;

    let { error } = await supabase.from("sjablonen").insert(rijen);
    // Migratie 0041 nog niet gedraaid: opnieuw proberen zonder het lettertype.
    if (kolomOntbreekt(error)) {
      ({ error } = await supabase
        .from("sjablonen")
        .insert(rijen.map(({ lettertype: _lettertype, ...rest }) => rest)));
    }

    if (error) fouten.push(`${type}: ${error.message}`);
    else toegevoegd += rijen.length;
  }

  revalidatePath("/sjablonen");
  // Het aantal dat er écht in ging melden, en een fout nooit stilzwijgend
  // inslikken — anders lijkt een mislukte import op een geslaagde.
  if (fouten.length) {
    redirect(
      `/sjablonen?geimporteerd=${toegevoegd}&fout=` +
        encodeURIComponent(fouten.join(" · ")),
    );
  }
  redirect(`/sjablonen?geimporteerd=${toegevoegd}`);
}
