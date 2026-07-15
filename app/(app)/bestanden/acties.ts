"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DriveLinkType } from "@/lib/drivelinks";

/** Voegt een Drive-link toe aan de centrale bestanden-lijst (nooit bestanden zelf). */
export async function voegBestandToe(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    redirect("/bestanden?fout=" + encodeURIComponent("URL is verplicht."));
  }
  const categorie = String(formData.get("categorie") ?? "").trim() || null;
  const supabase = createClient();

  // Nieuwe categorie meteen opslaan zodat 'ie in de lijst blijft staan.
  if (categorie) {
    await supabase
      .from("bestand_categorieen")
      .upsert({ naam: categorie }, { onConflict: "naam" });
  }

  const { error } = await supabase.from("drive_links").insert({
    titel: String(formData.get("titel") ?? "").trim() || url,
    url,
    type: (String(formData.get("type") ?? "drive") || "drive") as DriveLinkType,
    categorie,
    context_type: "algemeen",
  });
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden");
}

/** Werkt een bestaand bestand bij: titel, url, type én categorie. */
export async function bewerkBestand(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    redirect("/bestanden?fout=" + encodeURIComponent("URL is verplicht."));
  }
  const categorie = String(formData.get("categorie") ?? "").trim() || null;
  const supabase = createClient();

  // Nieuwe categorie meteen bewaren zodat 'ie in de lijst blijft staan.
  if (categorie) {
    await supabase
      .from("bestand_categorieen")
      .upsert({ naam: categorie }, { onConflict: "naam" });
  }

  const { error } = await supabase
    .from("drive_links")
    .update({
      titel: String(formData.get("titel") ?? "").trim() || url,
      url,
      type: (String(formData.get("type") ?? "drive") || "drive") as DriveLinkType,
      categorie,
    })
    .eq("id", id);
  if (error) redirect("/bestanden?fout=" + encodeURIComponent(error.message));
  revalidatePath("/bestanden");
  redirect("/bestanden");
}

/** Slaat een eigen categorie op (zonder direct een bestand toe te voegen). */
export async function maakCategorie(formData: FormData) {
  const naam = String(formData.get("naam") ?? "").trim();
  if (!naam) return;
  const supabase = createClient();
  await supabase.from("bestand_categorieen").upsert({ naam }, { onConflict: "naam" });
  revalidatePath("/bestanden");
}

/** Bewaart de handmatige volgorde van de categorieën (na slepen). */
export async function bewaarCategorieVolgorde(namen: string[]) {
  const supabase = createClient();
  // Upsert elke categorie met zijn nieuwe index als sortering.
  await Promise.all(
    namen.map((naam, i) =>
      supabase
        .from("bestand_categorieen")
        .upsert({ naam, sortering: i }, { onConflict: "naam" }),
    ),
  );
  revalidatePath("/bestanden");
}

/** Verwijdert een opgeslagen categorie (de links zelf blijven bestaan). */
export async function verwijderCategorie(naam: string) {
  const supabase = createClient();
  await supabase.from("bestand_categorieen").delete().eq("naam", naam);
  revalidatePath("/bestanden");
}

export async function verwijderBestand(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const supabase = createClient();
  await supabase.from("drive_links").delete().eq("id", id);
  revalidatePath("/bestanden");
}
