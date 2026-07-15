import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  projectStatusToon,
  PROJECT_STATUSSEN,
  type Project,
} from "@/lib/projecten";
import { KlantZoeker } from "@/components/KlantZoeker";
import { maakProject } from "./acties";

export default async function ProjectenPagina({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  const supabase = createClient();
  let projecten: Project[] = [];
  let klanten: { id: string; bedrijf: string }[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("projecten")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    projecten = (data ?? []) as Project[];
  } catch {
    schemaOntbreekt = true;
  }
  try {
    const { data } = await supabase.from("klanten").select("id, bedrijf").order("bedrijf");
    klanten = data ?? [];
  } catch {
    /* klanten-tabel nog niet aanwezig */
  }

  const actief = projecten.filter((p) => p.status === "actief").length;
  const afgerond = projecten.filter((p) => p.status === "afgerond").length;

  return (
    <>
      <PaginaKop
        titel="Projecten & notities"
        omschrijving="Houd per project notities en Drive-links bij."
      />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Totaal" waarde={String(projecten.length)} />
        <KpiKaart label="Actief" waarde={String(actief)} />
        <KpiKaart label="Afgerond" waarde={String(afgerond)} />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form
        action={maakProject}
        className="mb-8 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_2fr_1fr_auto]"
      >
        <input
          name="naam"
          required
          placeholder="Projectnaam *"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="omschrijving"
          placeholder="Korte omschrijving"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <KlantZoeker
          klanten={klanten}
          tekstNaam="klant"
          placeholder="Klant zoeken…"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Nieuw
        </button>
      </form>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0004 uit in de Supabase SQL Editor.</p>
        </div>
      ) : projecten.length === 0 ? (
        <LegeStaat titel="Nog geen projecten" omschrijving="Maak je eerste project hierboven aan." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projecten.map((p) => (
            <Link key={p.id} href={`/projecten/${p.id}`}>
              <Kaart className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-navy">{p.naam}</h3>
                  <Badge toon={projectStatusToon(p.status)}>
                    {PROJECT_STATUSSEN.find((s) => s.key === p.status)?.label}
                  </Badge>
                </div>
                {p.klant && <p className="mt-1 text-xs text-navy/50">{p.klant}</p>}
                {p.omschrijving && (
                  <p className="mt-2 line-clamp-3 text-sm text-navy/60">{p.omschrijving}</p>
                )}
              </Kaart>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
