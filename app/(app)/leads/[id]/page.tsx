import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEAD_BRONNEN, LEAD_STATUSSEN, scoreToon, type Lead } from "@/lib/leads";
import { haalCategorieen } from "@/lib/categorieen";
import {
  activiteitTypeLabel,
  activiteitToon,
  type Activiteit,
} from "@/lib/activiteiten";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LandRegio } from "@/components/LandRegio";
import { WebsiteVeld } from "@/components/WebsiteVeld";
import { datumKort } from "@/lib/format";
import { Markdown } from "@/components/ui/Markdown";
import type { Notitie } from "@/lib/projecten";
import { BevestigKnop } from "@/components/ui/BevestigKnop";
import {
  werkLeadBij,
  verwijderLead,
  maakKlantVanLead,
  planFollowup,
  maakActiviteit,
  rondActiviteitAf,
  maakLeadNotitie,
  verwijderLeadNotitie,
} from "../acties";

export default async function LeadDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string; fout?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const lead = data as Lead;

  const [{ data: aData }, { data: nData }, categorieen] = await Promise.all([
    supabase
      .from("activiteiten")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notities")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false }),
    haalCategorieen(supabase),
  ]);
  const activiteiten = (aData ?? []) as Activiteit[];
  const notities = (nData ?? []) as Notitie[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-base font-semibold text-navy hover:bg-navy/5"
          >
            ← Terug naar pipeline
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {lead.bedrijf}
            <Badge toon={scoreToon(lead.score)}>score {lead.score}</Badge>
          </h1>
          {lead.plaats && <p className="text-sm text-navy/50">{lead.plaats}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.klant_id ? (
            <Link
              href={`/klanten/${lead.klant_id}`}
              className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
            >
              Bekijk klant
            </Link>
          ) : (
            <form action={maakKlantVanLead.bind(null, lead.id)}>
              <button
                type="submit"
                className="rounded-lg bg-oranje px-3 py-1.5 text-sm font-medium text-white hover:bg-oranje/90"
              >
                Maak klant (prospect)
              </button>
            </form>
          )}
          <BevestigKnop
            actie={verwijderLead.bind(null, lead.id)}
            vraag={`Weet je zeker dat je lead ${lead.bedrijf} wilt verwijderen?`}
            label="Verwijderen"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          />
        </div>
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Opgeslagen.
        </p>
      )}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bewerken */}
        <form action={werkLeadBij.bind(null, lead.id)} className="lg:col-span-2">
          <Kaart>
            <Groep>Bedrijf &amp; vindplaats</Groep>
            <div className="grid gap-4 sm:grid-cols-2">
              <Veld label="Bedrijf" naam="bedrijf" waarde={lead.bedrijf} verplicht />
              <Veld label="Plaats" naam="plaats" waarde={lead.plaats} />
              <Veld label="Adres" naam="adres" waarde={lead.adres} />
              <WebsiteVeld waarde={lead.website} />
              <LandRegio
                land={lead.land ?? "Nederland"}
                regio={lead.provincie ?? ""}
                regioVeld="provincie"
                regioLabel="Provincie"
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                toonLabels
              />
              <Veld label="Google rating" naam="rating_google" waarde={lead.rating_google !== null ? String(lead.rating_google) : ""} type="number" />
              <Veld label="Aantal reviews" naam="aantal_reviews" waarde={lead.aantal_reviews !== null ? String(lead.aantal_reviews) : ""} type="number" />
              <Veld label="Google place_id" naam="place_id" waarde={lead.place_id} />
            </div>

            <Groep>Contactpersoon</Groep>
            <div className="grid gap-4 sm:grid-cols-2">
              <Veld label="Contactpersoon" naam="contact_naam" waarde={lead.contact_naam} />
              <Veld label="Functie" naam="functie" waarde={lead.functie} />
              <Veld label="Voornaam" naam="voornaam" waarde={lead.voornaam} />
              <Veld label="Achternaam" naam="achternaam" waarde={lead.achternaam} />
              <Veld label="Seniority" naam="seniority" waarde={lead.seniority} />
              <Veld label="Afdeling" naam="afdeling" waarde={lead.afdeling} />
              <Veld label="E-mail" naam="email" waarde={lead.email} type="email" />
              <Veld label="Telefoon (algemeen)" naam="telefoon" waarde={lead.telefoon} />
              <Veld label="Direct telefoonnr" naam="telefoon_contact" waarde={lead.telefoon_contact} />
              <Veld label="LinkedIn" naam="linkedin" waarde={lead.linkedin} />
              <Veld label="Twitter / X" naam="twitter" waarde={lead.twitter} />
            </div>

            <Groep>Kwalificatie &amp; pipeline</Groep>
            <div className="grid gap-4 sm:grid-cols-2">
              <Kies label="Bron" naam="bron" waarde={lead.bron} opties={LEAD_BRONNEN} />
              <Kies label="Status" naam="status" waarde={lead.status} opties={LEAD_STATUSSEN} />
              <KiesVrij label="IT-aanbod" naam="it_aanbod" waarde={lead.it_aanbod} opties={categorieen.it_aanbod} lijstId="lead-it_aanbod" />
              <KiesVrij label="Platform" naam="platform" waarde={lead.platform} opties={categorieen.platform} lijstId="lead-platform" />
              <KiesVrij label="Branche" naam="branche" waarde={lead.branche} opties={categorieen.branche} lijstId="lead-branche" />
              <KiesVrij label="Bedrijfsgrootte" naam="bedrijfsgrootte" waarde={lead.bedrijfsgrootte} opties={categorieen.bedrijfsgrootte} lijstId="lead-bedrijfsgrootte" />
              <Veld label="Aantal medewerkers" naam="aantal_medewerkers" waarde={lead.aantal_medewerkers !== null ? String(lead.aantal_medewerkers) : ""} type="number" />
              <Veld label="Score (0-100)" naam="score" waarde={String(lead.score)} type="number" />
              <Veld
                label="Verwachte waarde (€)"
                naam="verwachte_waarde"
                waarde={String(lead.verwachte_waarde)}
                type="number"
              />
            </div>

            <div className="mt-4">
              <Etiket>Notities</Etiket>
              <textarea
                name="notities"
                defaultValue={lead.notities ?? ""}
                rows={3}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            {/* openingszin ook bewerkbaar */}
            <input type="hidden" name="openingszin" value={lead.openingszin ?? ""} />
            <div className="mt-5">
              <button
                type="submit"
                className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
              >
                Opslaan
              </button>
            </div>
          </Kaart>
        </form>

        {/* Signalen + openingszin */}
        <div className="space-y-6">
          <Kaart>
            <h2 className="text-sm font-medium text-navy">Signalen</h2>
            {lead.signalen && lead.signalen.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {lead.signalen.map((sig, i) => (
                  <li key={i} className="text-sm text-navy/70">
                    <span className="font-medium text-navy">{sig.type}</span>
                    {sig.waarde ? `: ${sig.waarde}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-navy/50">Nog geen signalen.</p>
            )}
          </Kaart>

          <Kaart>
            <h2 className="text-sm font-medium text-navy">Gegenereerde openingszin</h2>
            <p className="mt-2 text-sm italic text-navy/70">
              {lead.openingszin || "Nog geen openingszin."}
            </p>
          </Kaart>
        </div>
      </div>

      {/* Activiteiten + follow-up */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-medium text-navy">Activiteitenlog</h2>
          {activiteiten.length === 0 ? (
            <Kaart>
              <p className="text-sm text-navy/50">Nog geen activiteiten.</p>
            </Kaart>
          ) : (
            <Kaart className="p-0">
              <ul>
                {activiteiten.map((a, i) => (
                  <li
                    key={a.id}
                    className={`flex items-center justify-between gap-3 px-5 py-3 ${
                      i > 0 ? "border-t border-navy/10" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge toon={activiteitToon(a.type)}>
                          {activiteitTypeLabel(a.type)}
                        </Badge>
                        <span className="text-sm text-navy">{a.titel ?? "—"}</span>
                        {a.status === "afgerond" && (
                          <span className="text-xs text-emerald-600">afgerond</span>
                        )}
                      </div>
                      {a.omschrijving && (
                        <p className="mt-1 text-xs text-navy/50">{a.omschrijving}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.follow_up_datum && (
                        <span className="text-xs text-oranje">
                          {datumKort(a.follow_up_datum)}
                        </span>
                      )}
                      {a.status === "open" && (
                        <form action={rondActiviteitAf.bind(null, a.id, lead.id)}>
                          <button
                            type="submit"
                            className="text-xs text-navy/40 hover:text-emerald-600"
                          >
                            afronden
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Kaart>
          )}

          {/* Nieuwe activiteit */}
          <form action={maakActiviteit.bind(null, lead.id)}>
            <Kaart>
              <p className="mb-2 text-sm font-medium text-navy">Activiteit loggen</p>
              <div className="flex flex-wrap gap-2">
                <select
                  name="type"
                  className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                >
                  <option value="notitie">Notitie</option>
                  <option value="call">Telefoon</option>
                  <option value="email">E-mail</option>
                </select>
                <input
                  name="titel"
                  placeholder="Titel"
                  className="min-w-40 flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                >
                  Loggen
                </button>
              </div>
            </Kaart>
          </form>
        </div>

        {/* Follow-up plannen */}
        <div>
          <form action={planFollowup.bind(null, lead.id)}>
            <Kaart>
              <h2 className="text-sm font-medium text-navy">Follow-up plannen</h2>
              <div className="mt-3 space-y-2">
                <input
                  name="titel"
                  placeholder="Waarover?"
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
                <input
                  name="follow_up_datum"
                  type="date"
                  required
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Follow-up inplannen
                </button>
              </div>
            </Kaart>
          </form>

          {/* Belnotities */}
          <form action={maakLeadNotitie.bind(null, lead.id)} className="mt-6">
            <Kaart>
              <h2 className="text-sm font-medium text-navy">Belnotities</h2>
              <input
                name="titel"
                placeholder="Titel"
                className="mt-3 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
              <textarea
                name="inhoud_markdown"
                rows={3}
                placeholder="Wat is er besproken?"
                className="mt-2 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm font-medium text-navy hover:bg-navy/5"
              >
                Notitie opslaan
              </button>
            </Kaart>
          </form>

          {notities.length > 0 && (
            <div className="mt-4 space-y-3">
              {notities.map((n) => (
                <Kaart key={n.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-navy">{n.titel}</h3>
                    <form action={verwijderLeadNotitie.bind(null, n.id, lead.id)}>
                      <button type="submit" className="text-xs text-navy/40 hover:text-red-500">
                        ×
                      </button>
                    </form>
                  </div>
                  <Markdown tekst={n.inhoud_markdown} />
                </Kaart>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Etiket({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-navy">{children}</label>;
}

/** Subkopje binnen het formulier. */
function Groep({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-navy/50 first:mt-0">
      {children}
    </p>
  );
}

const veldCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/** Vaste keuzelijst (bron, status). */
function Kies<T extends string>({
  label,
  naam,
  waarde,
  opties,
}: {
  label: string;
  naam: string;
  waarde: T;
  opties: { key: T; label: string }[];
}) {
  return (
    <div>
      <Etiket>{label}</Etiket>
      <select name={naam} defaultValue={waarde} className={veldCls}>
        {opties.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Combobox: kies een bestaande categorie of typ een nieuwe. De nieuwe waarde
 * wordt bij opslaan als echte categorie bewaard (zie lib/categorieen.ts).
 */
function KiesVrij({
  label,
  naam,
  waarde,
  opties,
  lijstId,
}: {
  label: string;
  naam: string;
  waarde: string | null;
  opties: string[];
  lijstId: string;
}) {
  return (
    <div>
      <Etiket>{label}</Etiket>
      <input
        name={naam}
        defaultValue={waarde ?? ""}
        list={lijstId}
        placeholder="Kies of typ nieuw…"
        className={veldCls}
      />
      <datalist id={lijstId}>
        {opties.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </div>
  );
}

function Veld({
  label,
  naam,
  waarde,
  type = "text",
  verplicht = false,
}: {
  label: string;
  naam: string;
  waarde: string | null;
  type?: string;
  verplicht?: boolean;
}) {
  return (
    <div>
      <Etiket>{label}</Etiket>
      <input
        name={naam}
        type={type}
        required={verplicht}
        defaultValue={waarde ?? ""}
        className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
    </div>
  );
}
