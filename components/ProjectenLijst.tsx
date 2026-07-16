import Link from "next/link";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { projectStatusToon, PROJECT_STATUSSEN, type Project } from "@/lib/projecten";

/** Projectkaarten voor in een vol scherm — kaarten linken naar het detail. */
export function ProjectenLijst({ projecten }: { projecten: Project[] }) {
  if (projecten.length === 0) {
    return <LegeStaat titel="Geen projecten" omschrijving="Er staan hier nog geen projecten in deze categorie." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
              <p className="mt-2 line-clamp-2 text-sm text-navy/60">{p.omschrijving}</p>
            )}
          </Kaart>
        </Link>
      ))}
    </div>
  );
}
