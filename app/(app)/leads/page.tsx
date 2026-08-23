import { Coins, Download, Maximize2, MapPin, Plus, Trophy, Upload, Users, Waypoints } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { TegelSheet } from "@/components/ui/TegelSheet";
import { LeadsLijst } from "@/components/LeadsLijst";
import { VolScherm } from "@/components/ui/VolScherm";
import { createClient } from "@/lib/supabase/server";
import { type Lead } from "@/lib/leads";
import { euro } from "@/lib/format";
import { MassaImport } from "@/components/MassaImport";
import { SnelToevoegen } from "./SnelToevoegen";
import { GoogleMapsZoeken } from "./GoogleMapsZoeken";
import { KanbanBord } from "./KanbanBord";
import { importeerLeads } from "./acties";

async function haalLeads(): Promise<{ leads: Lead[]; schemaOntbreekt: boolean }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("positie", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { leads: (data ?? []) as Lead[], schemaOntbreekt: false };
  } catch {
    return { leads: [], schemaOntbreekt: true };
  }
}

export default async function LeadsPagina({
  searchParams,
}: {
  searchParams: { fout?: string; q?: string };
}) {
  const { leads: alle, schemaOntbreekt } = await haalLeads();

  const q = (searchParams.q ?? "").toLowerCase().trim();
  const leads = q
    ? alle.filter((l) =>
        `${l.bedrijf ?? ""} ${l.plaats ?? ""} ${l.website ?? ""} ${l.contact_naam ?? ""} ${l.email ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    : alle;

  const actief = leads.filter((l) => l.status !== "gewonnen");
  const pipelineWaarde = actief.reduce(
    (s, l) => s + Number(l.verwachte_waarde || 0),
    0,
  );
  const gewonnen = leads.filter((l) => l.status === "gewonnen").length;
  const gemScore =
    leads.length > 0
      ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
      : 0;

  return (
    <>
      <PaginaKop
        titel="Leads & pipeline"
        omschrijving="Sleep leads tussen de kolommen om de status bij te werken."
      />

      {/* Vier tegels — klikken opent een vol scherm met de bijbehorende leads (X sluit). */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TegelSheet
          titel="Alle leads"
          tegel={<StatKaart label="Totaal leads" waarde={String(leads.length)} icoon={Users} toon="teal" />}
        >
          <LeadsLijst leads={leads} />
        </TegelSheet>
        <TegelSheet
          titel="Actief in pipeline"
          tegel={<StatKaart label="Actief in pipeline" waarde={String(actief.length)} icoon={Waypoints} toon="blauw" />}
        >
          <LeadsLijst leads={actief} />
        </TegelSheet>
        <TegelSheet
          titel="Pipeline-waarde"
          tegel={<StatKaart label="Pipeline-waarde" waarde={euro(pipelineWaarde)} icoon={Coins} toon="amber" />}
        >
          <LeadsLijst leads={actief} />
        </TegelSheet>
        <TegelSheet
          titel="Gewonnen leads"
          tegel={
            <StatKaart
              label="Gewonnen"
              waarde={String(gewonnen)}
              subtekst={`gem. score ${gemScore}`}
              icoon={Trophy}
              toon="groen"
            />
          }
        >
          <LeadsLijst leads={leads.filter((l) => l.status === "gewonnen")} />
        </TegelSheet>
      </section>

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {/* Zoeken op klant, plaats of website */}
      <form className="mb-6 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Zoek op klant, plaats of website…"
          className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy sm:w-80"
        />
        <button
          type="submit"
          className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Zoeken
        </button>
        {q && (
          <a href="/leads" className="text-sm text-navy/50 hover:underline">
            Wissen
          </a>
        )}
        {q && (
          <span className="text-xs text-navy/50">{leads.length} resultaat(en)</span>
        )}
      </form>

      {/* Toolbar: nieuwe lead + importeren — elk als vol scherm */}
      <div className="mb-6 flex flex-wrap gap-2">
        <VolScherm label="Nieuwe lead toevoegen" titel="Nieuwe lead" toon="blauw" icoon={<Plus size={16} />}>
          <SnelToevoegen />
        </VolScherm>
        <VolScherm label="Zoeken via Google Maps" titel="Leads zoeken via Google Maps" toon="oranje" icoon={<MapPin size={16} />}>
          <GoogleMapsZoeken />
        </VolScherm>
        <VolScherm label="Lijst importeren" titel="Leadlijst importeren" toon="navy" icoon={<Upload size={16} />}>
          <MassaImport
            titel="Lijst importeren uit Excel"
            importActie={importeerLeads}
        velden={[
          { key: "bedrijf", label: "Bedrijf", synoniemen: ["bedrijfsnaam", "company", "naam"] },
          { key: "plaats", label: "Plaats", synoniemen: ["stad", "city", "woonplaats"] },
          { key: "adres", label: "Adres", synoniemen: ["straat", "address"] },
          { key: "website", label: "Website", synoniemen: ["url", "site"] },
          { key: "land", label: "Land", synoniemen: ["country"] },
          { key: "provincie", label: "Provincie", synoniemen: ["regio", "region", "state"] },
          { key: "contact_naam", label: "Contactpersoon", synoniemen: ["contact", "naam contact"] },
          { key: "voornaam", label: "Voornaam", synoniemen: ["first name", "firstname"] },
          { key: "achternaam", label: "Achternaam", synoniemen: ["last name", "lastname", "achternaam contact"] },
          { key: "functie", label: "Functie", synoniemen: ["title", "job title", "rol"] },
          { key: "seniority", label: "Seniority", synoniemen: ["niveau"] },
          { key: "afdeling", label: "Afdeling", synoniemen: ["department"] },
          { key: "email", label: "E-mail", synoniemen: ["e-mail", "mail"] },
          { key: "telefoon", label: "Telefoon", synoniemen: ["tel", "phone"] },
          { key: "telefoon_contact", label: "Direct telefoonnr", synoniemen: ["direct", "mobiel", "mobile"] },
          { key: "linkedin", label: "LinkedIn", synoniemen: ["linkedin url"] },
          { key: "twitter", label: "Twitter/X", synoniemen: ["x", "twitter url"] },
          { key: "place_id", label: "Google place_id", synoniemen: ["placeid", "google id"] },
          { key: "rating_google", label: "Google rating", synoniemen: ["rating", "sterren"] },
          { key: "aantal_reviews", label: "Aantal reviews", synoniemen: ["reviews", "recensies"] },
          { key: "it_aanbod", label: "IT-aanbod", synoniemen: ["aanbod", "dienst"] },
          { key: "platform", label: "Platform", synoniemen: ["webshopplatform", "cms"] },
          { key: "branche", label: "Branche", synoniemen: ["niche", "sector"] },
          { key: "bedrijfsgrootte", label: "Bedrijfsgrootte", synoniemen: ["grootte", "size"] },
          { key: "aantal_medewerkers", label: "Aantal medewerkers", synoniemen: ["medewerkers", "employees", "fte"] },
          { key: "score", label: "Score" },
          { key: "verwachte_waarde", label: "Verwachte waarde", synoniemen: ["waarde", "value"] },
            ]}
          />
        </VolScherm>
        <a
          href="/api/export?type=leads-contact"
          className="inline-flex items-center gap-2 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          <Download size={16} />
          Contactlijst (.xlsx)
        </a>
        <a
          href="/api/export?type=leads"
          className="inline-flex items-center gap-2 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          <Download size={16} />
          Alles (.xlsx)
        </a>
      </div>

      {schemaOntbreekt ? (
        <SchemaMelding />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-navy">Pipeline</h2>
            <VolScherm
              label="Pipeline vergroten"
              titel="Pipeline — sleep tussen de kolommen"
              toon="navy"
              breed="vol"
              icoon={<Maximize2 size={16} />}
            >
              <KanbanBord leads={leads} />
            </VolScherm>
          </div>
          <KanbanBord leads={leads} />
        </>
      )}
    </>
  );
}

function SchemaMelding() {
  return (
    <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
      <p className="font-medium text-oranje">Datamodel nog niet actief</p>
      <p className="mt-1 text-navy/70">
        Voer <code className="rounded bg-navy/5 px-1">0004_canoniek_datamodel.sql</code>{" "}
        uit in de Supabase SQL Editor.
      </p>
    </div>
  );
}
