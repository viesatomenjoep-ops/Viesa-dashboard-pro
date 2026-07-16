import { Building2, UserPlus, Users } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { MassaImport } from "@/components/MassaImport";
import { createClient } from "@/lib/supabase/server";
import {
  KLANT_TYPES,
  klantTypeToon,
  klantTypeLabel,
  klantTypeKort,
  klantStatusToon,
  klantStatusLabel,
  type Klant,
} from "@/lib/klanten";
import { categorieKleur } from "@/lib/kleuren";
import { haalCategorieen } from "@/lib/categorieen";
import { LandRegio } from "@/components/LandRegio";
import { WebsiteVeld } from "@/components/WebsiteVeld";
import { KlantFilters } from "@/components/KlantFilters";
import { RijLink } from "@/components/ui/RijLink";
import { leesFout } from "@/lib/fout";
import { maakKlant, importeerKlanten } from "./acties";

// Altijd per-request renderen met de sessie van de ingelogde gebruiker
// (voorkomt een 'vastgebakken' banner uit een oude statische build).
export const dynamic = "force-dynamic";

const inputCls =
  "rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

export default async function KlantenPagina({
  searchParams,
}: {
  searchParams: {
    branche?: string;
    regio?: string;
    land?: string;
    type?: string;
    q?: string;
    fout?: string;
  };
}) {
  const supabase = createClient();
  let klanten: Klant[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("klanten")
      .select("*")
      .order("bedrijf", { ascending: true });
    if (error) throw error;
    klanten = (data ?? []) as Klant[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  // Branche-filter vullen met de werkelijke (vrije) categorieën + wat er al op
  // klanten staat, zodat een net toegevoegde branche meteen filterbaar is.
  const catLijsten = await haalCategorieen(supabase);
  const brancheOpties = Array.from(
    new Set([
      ...catLijsten.branche,
      ...klanten.map((k) => k.branche).filter((b): b is string => !!b),
    ]),
  ).sort((a, b) => a.localeCompare(b, "nl"));

  const q = (searchParams.q ?? "").toLowerCase();
  // Standaard op Nederland bij het openen; kiest de gebruiker 'Alle landen'
  // dan komt er ?land= (lege string) in de URL en tonen we alles.
  const landFilter = searchParams.land === undefined ? "Nederland" : searchParams.land;
  const zichtbaar = klanten.filter((k) => {
    if (searchParams.branche && k.branche !== searchParams.branche) return false;
    if (landFilter && k.land !== landFilter) return false;
    if (searchParams.regio && k.regio !== searchParams.regio) return false;
    if (searchParams.type && k.type !== searchParams.type) return false;
    if (q && !`${k.bedrijf} ${k.stad ?? ""} ${k.email ?? ""}`.toLowerCase().includes(q))
      return false;
    return true;
  });

  const klantLijst = klanten.filter((k) => k.type === "klant");
  const prospectLijst = klanten.filter((k) => k.type === "prospect");
  // Bij precies één resultaat klik je meteen door naar die klant; anders filtert
  // de tegel de lijst.
  const tegelHref = (lijst: Klant[], basis: string) =>
    lijst.length === 1 ? `/klanten/${lijst[0].id}` : basis;

  return (
    <>
      <PaginaKop
        titel="Klanten"
        omschrijving="Je centrale klantenbestand — leads, offertes en facturen hangen hieraan."
      />

      <section className="mb-6 grid grid-cols-3 gap-4">
        <StatKaart
          label="Totaal"
          waarde={String(klanten.length)}
          icoon={Users}
          toon="teal"
          href={tegelHref(klanten, "/klanten")}
        />
        <StatKaart
          label="Klanten"
          waarde={String(klantLijst.length)}
          icoon={Building2}
          toon="groen"
          href={tegelHref(klantLijst, "/klanten?type=klant")}
        />
        <StatKaart
          label="Prospects"
          waarde={String(prospectLijst.length)}
          icoon={UserPlus}
          toon="blauw"
          href={tegelHref(prospectLijst, "/klanten?type=prospect")}
        />
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Filters — direct onder de tegels (land eerst, dan regio's) */}
      <KlantFilters
        q={searchParams.q ?? ""}
        land={landFilter}
        regio={searchParams.regio ?? ""}
        branche={searchParams.branche ?? ""}
        type={searchParams.type ?? ""}
        branches={brancheOpties}
      />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0008_klanten.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : zichtbaar.length === 0 ? (
        <LegeStaat titel="Geen klanten" omschrijving="Voeg een klant toe of importeer een lijst." />
      ) : (
        <Kaart className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="px-3 py-3 font-medium sm:px-5">Bedrijf</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Stad</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell sm:px-5">Branche</th>
                <th className="px-3 py-3 font-medium sm:px-5">Type</th>
                <th className="px-3 py-3 font-medium sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((k) => (
                <RijLink
                  key={k.id}
                  href={`/klanten/${k.id}`}
                  className="border-b border-navy/10 last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-3 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <Avatar naam={k.bedrijf} />
                      <div className="min-w-0">
                        <span className="block max-w-[46vw] truncate font-medium text-navy sm:max-w-none">
                          {k.bedrijf}
                        </span>
                        <span className="block text-xs text-navy/40 sm:hidden">
                          {k.stad ?? "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-navy/70 sm:table-cell sm:px-5">{k.stad ?? "—"}</td>
                  <td className="hidden px-3 py-3 sm:table-cell sm:px-5">
                    {k.branche ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categorieKleur(
                          k.branche,
                        )}`}
                      >
                        {k.branche}
                      </span>
                    ) : (
                      <span className="text-navy/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <Badge toon={klantTypeToon(k.type)}>
                      <span className="sm:hidden">{klantTypeKort(k.type)}</span>
                      <span className="hidden sm:inline">{klantTypeLabel(k.type)}</span>
                    </Badge>
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <Badge toon={klantStatusToon(k.status)}>{klantStatusLabel(k.status)}</Badge>
                  </td>
                </RijLink>
              ))}
            </tbody>
          </table>
        </Kaart>
      )}

      {/* Nieuwe klant — onderaan de pagina */}
      <form action={maakKlant} className="mb-6 mt-10">
        <Kaart>
          <p className="mb-3 text-sm font-medium text-navy">Nieuwe klant</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="bedrijf" required placeholder="Bedrijf *" className={inputCls} />
            <input name="contact_naam" placeholder="Contactpersoon" className={inputCls} />
            <input name="email" type="email" placeholder="E-mail" className={inputCls} />
            <input name="telefoon" placeholder="Telefoon" className={inputCls} />
            <WebsiteVeld compact waarde={null} placeholder="Website" />
            <input name="logo_url" type="url" placeholder="Logo-URL (voor offertes)" className={inputCls} />
            <input name="straat" placeholder="Straat + nr" className={inputCls} />
            <input name="postcode" placeholder="Postcode" className={inputCls} />
            <input name="stad" placeholder="Stad" className={inputCls} />
            <LandRegio className={inputCls} />
            <input
              name="branche"
              list="nieuwe-klant-branches"
              placeholder="Branche (kies of typ)"
              className={inputCls}
            />
            <datalist id="nieuwe-klant-branches">
              {brancheOpties.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <select name="type" defaultValue="prospect" className={inputCls}>
              {KLANT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              + Klant toevoegen
            </button>
          </div>
        </Kaart>
      </form>

      {/* Bulk-import — onderaan de pagina */}
      <MassaImport
        titel="Klantenlijst importeren uit Excel"
        importActie={importeerKlanten}
        velden={[
          { key: "bedrijf", label: "Bedrijf", synoniemen: ["bedrijfsnaam", "company"] },
          { key: "contact_naam", label: "Contactpersoon", synoniemen: ["contact"] },
          { key: "voornaam", label: "Voornaam", synoniemen: ["first name", "firstname"] },
          { key: "achternaam", label: "Achternaam", synoniemen: ["last name", "lastname"] },
          { key: "functie", label: "Functie", synoniemen: ["title", "rol"] },
          { key: "seniority", label: "Seniority", synoniemen: ["niveau"] },
          { key: "afdeling", label: "Afdeling", synoniemen: ["department"] },
          { key: "email", label: "E-mail", synoniemen: ["e-mail", "mail"] },
          { key: "telefoon", label: "Telefoon", synoniemen: ["tel"] },
          { key: "telefoon_contact", label: "Direct telefoonnr", synoniemen: ["direct", "mobiel"] },
          { key: "website", label: "Website", synoniemen: ["url"] },
          { key: "logo_url", label: "Logo-URL", synoniemen: ["logo", "logourl"] },
          { key: "stad", label: "Stad", synoniemen: ["plaats", "city"] },
          { key: "regio", label: "Regio", synoniemen: ["provincie"] },
          { key: "land", label: "Land" },
          { key: "place_id", label: "Google place_id", synoniemen: ["placeid"] },
          { key: "rating_google", label: "Google rating", synoniemen: ["rating", "sterren"] },
          { key: "aantal_reviews", label: "Aantal reviews", synoniemen: ["reviews", "recensies"] },
          { key: "it_aanbod", label: "IT-aanbod", synoniemen: ["aanbod", "dienst"] },
          { key: "platform", label: "Platform", synoniemen: ["cms", "webshopplatform"] },
          { key: "branche", label: "Branche", synoniemen: ["niche", "sector"] },
          { key: "bedrijfsgrootte", label: "Bedrijfsgrootte", synoniemen: ["grootte", "size"] },
          { key: "aantal_medewerkers", label: "Aantal medewerkers", synoniemen: ["medewerkers", "employees", "fte"] },
          { key: "type", label: "Type" },
        ]}
      />
    </>
  );
}
