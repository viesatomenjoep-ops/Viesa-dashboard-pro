import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { klantTypeToon, klantTypeLabel, type Klant } from "@/lib/klanten";

/** Compacte klantenlijst voor in een vol scherm — rijen linken naar het detail. */
export function KlantenLijst({ klanten }: { klanten: Klant[] }) {
  if (klanten.length === 0) {
    return <LegeStaat titel="Geen klanten" omschrijving="Er staan hier nog geen klanten in deze categorie." />;
  }
  return (
    <Kaart className="p-0">
      <ul>
        {klanten.map((k, i) => (
          <li key={k.id} className={i > 0 ? "border-t border-navy/10" : ""}>
            <Link
              href={`/klanten/${k.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-navy/[0.02]"
            >
              <Avatar naam={k.bedrijf} />
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-navy">{k.bedrijf}</span>
                <span className="block truncate text-xs text-navy/50">
                  {k.stad ?? "—"}
                  {k.email ? ` · ${k.email}` : ""}
                </span>
              </div>
              <Badge toon={klantTypeToon(k.type)}>{klantTypeLabel(k.type)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </Kaart>
  );
}
