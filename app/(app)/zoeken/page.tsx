import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";

type Treffer = { href: string; titel: string; sub: string };

export default async function ZoekPagina({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const groepen: { label: string; treffers: Treffer[] }[] = [];

  if (q) {
    const supabase = createClient();
    const like = `%${q}%`;

    const [leads, projecten, notities, offertes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, bedrijf, plaats")
        .or(`bedrijf.ilike.${like},plaats.ilike.${like},notities.ilike.${like}`)
        .limit(10),
      supabase
        .from("projecten")
        .select("id, naam, klant")
        .or(`naam.ilike.${like},omschrijving.ilike.${like},klant.ilike.${like}`)
        .limit(10),
      supabase
        .from("notities")
        .select("id, titel, project_id, lead_id")
        .or(`titel.ilike.${like},inhoud_markdown.ilike.${like}`)
        .limit(10),
      supabase
        .from("offertes")
        .select("id, nummer, titel, klant")
        .or(`titel.ilike.${like},nummer.ilike.${like},klant.ilike.${like}`)
        .limit(10),
    ]);

    groepen.push({
      label: "Leads",
      treffers: (leads.data ?? []).map((l) => ({
        href: `/leads/${l.id}`,
        titel: l.bedrijf,
        sub: l.plaats ?? "",
      })),
    });
    groepen.push({
      label: "Projecten",
      treffers: (projecten.data ?? []).map((p) => ({
        href: `/projecten/${p.id}`,
        titel: p.naam,
        sub: p.klant ?? "",
      })),
    });
    groepen.push({
      label: "Notities",
      treffers: (notities.data ?? []).map((n) => ({
        href: n.project_id ? `/projecten/${n.project_id}` : n.lead_id ? `/leads/${n.lead_id}` : "/projecten",
        titel: n.titel,
        sub: "notitie",
      })),
    });
    groepen.push({
      label: "Offertes",
      treffers: (offertes.data ?? []).map((o) => ({
        href: `/offertes/${o.id}`,
        titel: `${o.nummer} — ${o.titel}`,
        sub: o.klant ?? "",
      })),
    });
  }

  const totaal = groepen.reduce((s, g) => s + g.treffers.length, 0);

  return (
    <>
      <PaginaKop titel="Zoeken" omschrijving={q ? `Resultaten voor "${q}"` : "Typ een zoekterm in de balk bovenaan."} />
      {q && totaal === 0 ? (
        <LegeStaat titel="Niets gevonden" omschrijving={`Geen resultaten voor "${q}".`} />
      ) : (
        <div className="space-y-6">
          {groepen
            .filter((g) => g.treffers.length > 0)
            .map((g) => (
              <section key={g.label}>
                <h2 className="mb-2 text-sm font-medium text-navy/60">
                  {g.label} <span className="text-navy/40">{g.treffers.length}</span>
                </h2>
                <Kaart className="p-0">
                  <ul>
                    {g.treffers.map((t, i) => (
                      <li key={t.href + i} className={i > 0 ? "border-t border-navy/10" : ""}>
                        <Link
                          href={t.href}
                          className="flex items-center justify-between px-5 py-3 hover:bg-navy/[0.02]"
                        >
                          <span className="text-sm text-navy">{t.titel}</span>
                          <span className="text-xs text-navy/40">{t.sub}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Kaart>
              </section>
            ))}
        </div>
      )}
    </>
  );
}
