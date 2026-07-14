import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { DesignEditor } from "./DesignEditor";

type DesignDoc = {
  id: string;
  pad: string;
  inhoud_markdown: string;
  laatst_gesynct_op: string | null;
};

export default async function DesignPagina({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const supabase = createClient();
  let docs: DesignDoc[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("design_docs")
      .select("id, pad, inhoud_markdown, laatst_gesynct_op")
      .order("pad");
    if (error) throw error;
    docs = (data ?? []) as DesignDoc[];
  } catch {
    schemaOntbreekt = true;
  }

  const actief = searchParams.id ? docs.find((d) => d.id === searchParams.id) : null;

  if (actief) {
    return (
      <>
        <div className="mb-6">
          <Link href="/design" className="text-sm text-navy/60 hover:underline">
            ← Terug naar design systems
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-navy">{actief.pad}</h1>
        </div>
        <DesignEditor id={actief.id} beginwaarde={actief.inhoud_markdown} />
      </>
    );
  }

  return (
    <>
      <PaginaKop
        titel="Design systems"
        omschrijving="Bewerk de markdown-bestanden met live preview, autosave en GitHub-sync."
      />
      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0004 uit in de Supabase SQL Editor.</p>
        </div>
      ) : docs.length === 0 ? (
        <LegeStaat
          titel="Nog geen design-documenten"
          omschrijving="Seed voegt viesa-huisstijl.md, offerte-template.md en e-mail-toon.md toe."
        />
      ) : (
        <Kaart className="p-0">
          <ul>
            {docs.map((d, i) => (
              <li key={d.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                <Link
                  href={`/design?id=${d.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-navy/[0.02]"
                >
                  <span className="font-mono text-sm text-navy">{d.pad}</span>
                  <span className="text-xs text-navy/40">
                    {d.laatst_gesynct_op ? "gesynct" : "niet gesynct"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}
