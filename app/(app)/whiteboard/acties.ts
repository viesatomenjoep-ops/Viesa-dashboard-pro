"use server";

import { createClient } from "@/lib/supabase/server";

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
    .from("sticky_notes")
    .insert({ whiteboard_id: whiteboardId, x, y, tekst: "" })
    .select("id, tekst, kleur, x, y, breedte, hoogte, z_index")
    .single();
  return (data as StickyNote) ?? null;
}

export async function werkNotePositie(id: string, x: number, y: number) {
  const supabase = createClient();
  await supabase.from("sticky_notes").update({ x, y }).eq("id", id);
}

export async function werkNoteTekst(id: string, tekst: string) {
  const supabase = createClient();
  await supabase.from("sticky_notes").update({ tekst }).eq("id", id);
}

export async function werkNoteKleur(id: string, kleur: string) {
  const supabase = createClient();
  await supabase.from("sticky_notes").update({ kleur }).eq("id", id);
}

export async function verwijderNote(id: string) {
  const supabase = createClient();
  await supabase.from("sticky_notes").delete().eq("id", id);
}
