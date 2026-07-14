import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import {
  DIENSTEN,
  integratieStatusToon,
  integratieStatusLabel,
  type Integratie,
} from "@/lib/integraties";
import { wijzigIntegratieStatus } from "./acties";

export default async function KoppelingenPagina() {
  const supabase = createClient();
  let integraties: Integratie[] = [];
  let schemaOntbreekt = false;

  try {
    const { data, error } = await supabase.from("integraties").select("*");
    if (error) throw error;
    integraties = (data ?? []) as Integratie[];

    // Ontbrekende diensten aanmaken (owner_id via default auth.uid()).
    const bestaand = new Set(integraties.map((i) => i.dienst));
    const missend = DIENSTEN.filter((d) => !bestaand.has(d.key));
    if (missend.length > 0) {
      await supabase
        .from("integraties")
        .insert(missend.map((d) => ({ dienst: d.key })));
      const { data: opnieuw } = await supabase.from("integraties").select("*");
      integraties = (opnieuw ?? []) as Integratie[];
    }
  } catch {
    schemaOntbreekt = true;
  }

  const statusVan = (key: string) =>
    integraties.find((i) => i.dienst === key)?.status ?? "niet_verbonden";

  return (
    <>
      <PaginaKop
        titel="Koppelingen"
        omschrijving="Beheer de verbindingen met je diensten. Geheimen staan in de omgeving/Vault, nooit in de database."
      />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de migraties uit in de Supabase SQL Editor.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIENSTEN.map((d) => {
            const status = statusVan(d.key);
            const verbonden = status === "verbonden";
            const nieuweStatus = verbonden ? "niet_verbonden" : "verbonden";
            return (
              <Kaart key={d.key} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-navy">{d.label}</h3>
                    <Badge toon={integratieStatusToon(status)}>
                      {integratieStatusLabel(status)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-navy/60">{d.omschrijving}</p>
                </div>
                <form
                  action={wijzigIntegratieStatus.bind(null, d.key, nieuweStatus)}
                  className="mt-4"
                >
                  <button
                    type="submit"
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      verbonden
                        ? "border-navy/20 text-navy hover:bg-navy/5"
                        : "border-oranje bg-oranje text-white hover:bg-oranje/90"
                    }`}
                  >
                    {verbonden ? "Verbinding verbreken" : "Verbinden"}
                  </button>
                </form>
              </Kaart>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-navy/50">
        OAuth-tokens en API-sleutels worden in de omgeving of Supabase Vault bewaard.
        De verbind-knoppen markeren voorlopig de status; de daadwerkelijke OAuth-flows
        worden per dienst aangesloten.
      </p>
    </>
  );
}
