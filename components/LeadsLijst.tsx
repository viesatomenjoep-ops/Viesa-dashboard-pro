import Link from "next/link";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { leadStatusLabel, scoreToon, type Lead } from "@/lib/leads";
import { euro } from "@/lib/format";

/** Leadslijst voor in een vol scherm — rijen linken naar het detail. */
export function LeadsLijst({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return <LegeStaat titel="Geen leads" omschrijving="Er staan hier geen leads in deze categorie." />;
  }
  return (
    <Kaart className="p-0">
      <ul>
        {leads.map((l, i) => (
          <li key={l.id} className={i > 0 ? "border-t border-navy/10" : ""}>
            <Link
              href={`/leads/${l.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-navy/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-navy">{l.bedrijf}</span>
                <span className="block truncate text-xs text-navy/50">
                  {l.plaats ?? "—"}
                  {Number(l.verwachte_waarde) > 0 ? ` · ${euro(l.verwachte_waarde)}` : ""}
                </span>
              </div>
              <Badge toon={scoreToon(l.score)}>{leadStatusLabel(l.status)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </Kaart>
  );
}
