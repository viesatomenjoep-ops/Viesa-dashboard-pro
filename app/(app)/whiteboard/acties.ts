"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function maakBord(formData: FormData) {
  const naam = String(formData.get("naam") ?? "Bord").trim() || "Bord";
  const supabase = createClient();
  const { data } = await supabase
    .from("whiteboards")
    .insert({ naam })
    .select("id")
    .single();
  revalidatePath("/whiteboard");
  redirect(data ? `/whiteboard?bord=${data.id}` : "/whiteboard");
}

export async function verwijderBord(id: string) {
  const supabase = createClient();
  await supabase.from("whiteboards").delete().eq("id", id);
  revalidatePath("/whiteboard");
  redirect("/whiteboard");
}

export type StickyNote = {
  id: string;
  tekst: string;
  kleur: string;
  x: number;
  y: number;
  breedte: number;
  hoogte: number;
  z_index: number;
};

export async function maakNote(
  whiteboardId: string,
  x: number,
  y: number,
): Promise<StickyNote | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("stickies")
    .insert({ whiteboard_id: whiteboardId, x, y, tekst: "" })
    .select("id, tekst, kleur, x, y, breedte, hoogte, z_index")
    .single();
  return (data as StickyNote) ?? null;
}

export async function werkNotePositie(id: string, x: number, y: number) {
  const supabase = createClient();
  await supabase.from("stickies").update({ x, y }).eq("id", id);
}

export async function werkNoteTekst(id: string, tekst: string) {
  const supabase = createClient();
  await supabase.from("stickies").update({ tekst }).eq("id", id);
}

export async function werkNoteKleur(id: string, kleur: string) {
  const supabase = createClient();
  await supabase.from("stickies").update({ kleur }).eq("id", id);
}

export async function verwijderNote(id: string) {
  const supabase = createClient();
  await supabase.from("stickies").delete().eq("id", id);
}
