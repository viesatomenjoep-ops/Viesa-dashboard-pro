import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { RijLink } from "@/components/ui/RijLink";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { offerteStatusToon, offerteStatusLabel, type Offerte } from "@/lib/offertes";
import { euro, datumKort } from "@/lib/format";

/** Offertetabel voor in een vol scherm — rijen linken naar het detail. */
export function OffertesLijst({ offertes }: { offertes: Offerte[] }) {
  if (offertes.length === 0) {
    return <LegeStaat titel="Geen offertes" omschrijving="Er staan hier nog geen offertes in deze categorie." />;
  }
  return (
    <Kaart className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy/10 text-left text-navy/50">
            <th className="px-3 py-3 font-medium sm:px-5">Nummer</th>
            <th className="px-3 py-3 font-medium sm:px-5">Titel</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Klant</th>
            <th className="px-3 py-3 font-medium sm:px-5">Status</th>
            <th className="px-3 py-3 font-medium sm:px-5">Bedrag</th>
            <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Aangemaakt</th>
          </tr>
        </thead>
        <tbody>
          {offertes.map((o) => (
            <RijLink
              key={o.id}
              href={`/offertes/${o.id}`}
              className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
            >
              <td className="px-3 py-3 font-medium text-navy sm:px-5">{o.nummer}</td>
              <td className="max-w-[40vw] truncate px-3 py-3 text-navy sm:max-w-none sm:px-5">
                {o.titel}
              </td>
              <td className="hidden px-3 py-3 text-navy/70 sm:table-cell sm:px-5">{o.klant ?? "—"}</td>
              <td className="px-3 py-3 sm:px-5">
                <Badge toon={offerteStatusToon(o.status)}>{offerteStatusLabel(o.status)}</Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-navy sm:px-5">{euro(o.bedrag)}</td>
              <td className="hidden px-3 py-3 text-navy/50 sm:table-cell sm:px-5">{datumKort(o.created_at)}</td>
            </RijLink>
          ))}
        </tbody>
      </table>
    </Kaart>
  );
}
