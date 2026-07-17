import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { RijLink } from "@/components/ui/RijLink";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { factuurStatusToon, factuurStatusLabel, type Factuur } from "@/lib/facturen";
import { euro, datumKort } from "@/lib/format";

/** Facturenlijst voor in een vol scherm — rijen linken naar het detail. */
export function FacturenLijst({ facturen }: { facturen: Factuur[] }) {
  if (facturen.length === 0) {
    return <LegeStaat titel="Geen facturen" omschrijving="Er staan hier geen facturen in deze categorie." />;
  }
  return (
    <Kaart className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-left text-navy/50">
            <th className="px-3 py-3 font-medium sm:px-5">Nummer</th>
            <th className="px-3 py-3 font-medium sm:px-5">Klant</th>
            <th className="px-3 py-3 font-medium sm:px-5">Bedrag</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Vervaldatum</th>
            <th className="px-3 py-3 font-medium sm:px-5">Status</th>
          </tr>
        </thead>
        <tbody>
          {facturen.map((f) => (
            <RijLink
              key={f.id}
              href={`/facturen/${f.id}`}
              className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
            >
              <td className="px-3 py-3 font-medium text-navy sm:px-5">{f.nummer}</td>
              <td className="max-w-[36vw] truncate px-3 py-3 text-navy sm:max-w-none sm:px-5">
                {f.klant ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-navy sm:px-5">{euro(f.bedrag)}</td>
              <td className="hidden px-3 py-3 text-navy/50 sm:table-cell sm:px-5">
                {f.vervaldatum ? datumKort(f.vervaldatum) : "—"}
              </td>
              <td className="px-3 py-3 sm:px-5">
                <Badge toon={factuurStatusToon(f.status)}>{factuurStatusLabel(f.status)}</Badge>
              </td>
            </RijLink>
          ))}
        </tbody>
      </table>
    </Kaart>
  );
}
