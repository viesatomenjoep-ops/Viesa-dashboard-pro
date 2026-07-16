import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { VolScherm } from "@/components/ui/VolScherm";
import { createClient } from "@/lib/supabase/server";
import { Whiteboard } from "./Whiteboard";
import { maakBord, verwijderBord, type StickyNote } from "./acties";

type Bord = { id: string; naam: string };

export default async function WhiteboardPagina({
  searchParams,
}: {
  searchParams: { bord?: string };
}) {
  const supabase = createClient();
  let borden: Bord[] = [];
  let schemaOntbreekt = false;

  try {
    const { data, error } = await supabase
      .from("whiteboards")
      .select("id, naam")
      .order("created_at", { ascending: true });
    if (error) throw error;
    borden = (data ?? []) as Bord[];
  } catch {
    schemaOntbreekt = true;
  }

  const actiefId = searchParams.bord ?? borden[0]?.id ?? null;

  let notes: StickyNote[] = [];
  if (actiefId) {
    const { data } = await supabase
      .from("stickies")
      .select("id, tekst, kleur, x, y, breedte, hoogte, z_index")
      .eq("whiteboard_id", actiefId)
      .order("created_at", { ascending: true });
    notes = (data ?? []) as StickyNote[];
  }

  return (
    <>
      <PaginaKop
        titel="Ideeën-whiteboard"
        omschrijving="Meerdere borden met sleepbare sticky notes."
      />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0004 uit in de Supabase SQL Editor.</p>
        </div>
      ) : (
        <>
          {/* Bordkiezer */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {borden.map((b) => (
              <Link
                key={b.id}
                href={`/whiteboard?bord=${b.id}`}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  b.id === actiefId
                    ? "border-navy bg-navy/5 font-medium text-navy"
                    : "border-navy/20 text-navy/70 hover:bg-navy/5"
                }`}
              >
                {b.naam}
              </Link>
            ))}
            <form action={maakBord} className="flex items-center gap-1">
              <input
                name="naam"
                placeholder="Nieuw bord"
                className="w-32 rounded-lg border border-navy/20 px-2 py-1.5 text-sm text-navy outline-none focus:border-navy"
              />
              <button
                type="submit"
                className="rounded-lg border border-navy/20 px-2 py-1.5 text-sm text-navy hover:bg-navy/5"
              >
                +
              </button>
            </form>
            {actiefId && borden.length > 1 && (
              <form action={verwijderBord.bind(null, actiefId)} className="ml-auto">
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Bord verwijderen
                </button>
              </form>
            )}
          </div>

          {actiefId ? (
            <VolScherm
              label="Open ideeën-whiteboard"
              titel="Ideeën-whiteboard"
              breed="vol"
              icoon={<Maximize2 size={16} />}
            >
              <Whiteboard key={actiefId} whiteboardId={actiefId} beginNotes={notes} />
            </VolScherm>
          ) : (
            <form action={maakBord}>
              <input type="hidden" name="naam" value="Ideeën" />
              <button
                type="submit"
                className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
              >
                Eerste bord aanmaken
              </button>
            </form>
          )}
        </>
      )}
    </>
  );
}
