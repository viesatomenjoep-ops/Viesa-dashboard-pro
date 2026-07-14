import { PaginaKop } from "@/components/ui/PaginaKop";
import { createClient } from "@/lib/supabase/server";
import { Whiteboard } from "./Whiteboard";
import type { StickyNote } from "./acties";

export default async function WhiteboardPagina() {
  const supabase = createClient();

  let whiteboardId: string | null = null;
  let notes: StickyNote[] = [];
  let schemaOntbreekt = false;

  try {
    // Zorg voor één standaard-whiteboard.
    const { data: bestaand, error } = await supabase
      .from("whiteboards")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    if (bestaand) {
      whiteboardId = bestaand.id;
    } else {
      const { data: nieuw, error: maakFout } = await supabase
        .from("whiteboards")
        .insert({ naam: "Whiteboard" })
        .select("id")
        .single();
      if (maakFout) throw maakFout;
      whiteboardId = nieuw?.id ?? null;
    }

    if (whiteboardId) {
      const { data } = await supabase
        .from("sticky_notes")
        .select("id, tekst, kleur, x, y, breedte, hoogte, z_index")
        .eq("whiteboard_id", whiteboardId)
        .order("created_at", { ascending: true });
      notes = (data ?? []) as StickyNote[];
    }
  } catch {
    schemaOntbreekt = true;
  }

  return (
    <>
      <PaginaKop
        titel="Whiteboard"
        omschrijving="Sleepbare sticky notes voor vrij denkwerk."
      />
      {schemaOntbreekt || !whiteboardId ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de migraties uit in de Supabase SQL Editor.</p>
        </div>
      ) : (
        <Whiteboard whiteboardId={whiteboardId} beginNotes={notes} />
      )}
    </>
  );
}
