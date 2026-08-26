import { AlarmClock, CalendarCheck, CalendarClock, UserX } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { leesFout } from "@/lib/fout";
import {
  TIJDVAKKEN,
  dagenStil,
  perTijdvak,
  vandaagISO,
  type Followup,
  type LeadZonderFollowup,
} from "@/lib/followups";
import { FollowupRij } from "./FollowupRij";
import { ZonderFollowup } from "./ZonderFollowup";

export const dynamic = "force-dynamic";

/** Haalt alle openstaande follow-ups op, met de gegevens van de lead erbij. */
async function haalFollowups(): Promise<{ lijst: Followup[]; fout: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("activiteiten")
      .select(
        "id, lead_id, titel, omschrijving, follow_up_datum, created_at, leads(bedrijf, telefoon, telefoon_contact, email)",
      )
      .eq("type", "follow_up")
      .eq("status", "open")
      .order("follow_up_datum");
    if (error) throw error;

    const lijst = (data ?? []).map((r) => {
      // De embed kan een object óf een array opleveren; beide afvangen.
      const rel = r.leads as
        | { bedrijf: string | null; telefoon: string | null; telefoon_contact: string | null; email: string | null }
        | { bedrijf: string | null; telefoon: string | null; telefoon_contact: string | null; email: string | null }[]
        | null;
      const lead = Array.isArray(rel) ? rel[0] : rel;
      return {
        id: r.id,
        lead_id: r.lead_id,
        titel: r.titel,
        omschrijving: r.omschrijving,
        follow_up_datum: r.follow_up_datum,
        created_at: r.created_at,
        bedrijf: lead?.bedrijf ?? null,
        telefoon: lead?.telefoon_contact || lead?.telefoon || null,
        email: lead?.email ?? null,
      } as Followup;
    });
    return { lijst, fout: "" };
  } catch (e) {
    return { lijst: [], fout: leesFout(e) };
  }
}

/**
 * Open leads zónder openstaande follow-up — het stille lek.
 *
 * Twee queries in plaats van een `not in`-subquery: die is in PostgREST
 * omslachtig en breekt zodra er veel activiteiten zijn. Het aantal leads is
 * hier klein genoeg om het verschil in code te nemen.
 */
async function haalZonderFollowup(): Promise<LeadZonderFollowup[]> {
  const supabase = createClient();
  try {
    const { data: openstaand } = await supabase
      .from("activiteiten")
      .select("lead_id")
      .eq("type", "follow_up")
      .eq("status", "open");
    const heeftAl = new Set(
      (openstaand ?? []).map((r) => r.lead_id).filter(Boolean) as string[],
    );

    // Sorteren op stilte, niet op score — anders vallen juist de vergeten
    // leads buiten de limiet, en dat zijn precies de leads die dit blok moet
    // vangen. Nooit gebeld (null) staat vooraan, daarna het langst geleden.
    // `gewonnen` is de enige eindstatus in het datamodel (migratie 0004).
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, bedrijf, status, score, verwachte_waarde, laatst_gebeld, updated_at, telefoon",
      )
      .neq("status", "gewonnen")
      .order("laatst_gebeld", { ascending: true, nullsFirst: true })
      .limit(200);
    if (error) throw error;

    return ((data ?? []) as LeadZonderFollowup[])
      .filter((l) => !heeftAl.has(l.id))
      .sort((a, b) => dagenStil(b) - dagenStil(a))
      .slice(0, 25);
  } catch {
    return [];
  }
}

export default async function FollowupsPagina() {
  const [{ lijst, fout }, zonder] = await Promise.all([
    haalFollowups(),
    haalZonderFollowup(),
  ]);

  const groepen = perTijdvak(lijst);
  const vandaag = vandaagISO();
  const achterstallig = groepen.achterstallig.length;
  const vandaagAantal = groepen.vandaag.length;
  const dezeWeek = groepen.deze_week.length;

  return (
    <>
      <PaginaKop
        titel="Follow-ups"
        omschrijving="Alles wat nog opgevolgd moet worden — en de leads die nergens meer op de rol staan."
      />

      {/* KPI's bovenaan */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKaart
          label="Achterstallig"
          waarde={String(achterstallig)}
          icoon={AlarmClock}
          toon={achterstallig > 0 ? "amber" : "groen"}
        />
        <StatKaart label="Vandaag" waarde={String(vandaagAantal)} icoon={CalendarCheck} toon="teal" />
        <StatKaart label="Deze week" waarde={String(dezeWeek)} icoon={CalendarClock} toon="blauw" />
        <StatKaart
          label="Zonder follow-up"
          waarde={String(zonder.length)}
          icoon={UserX}
          toon={zonder.length > 0 ? "amber" : "groen"}
        />
      </section>

      {fout && (
        <div className="mb-6 rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Follow-ups niet op te halen</p>
          <p className="mt-1 font-mono text-xs text-navy/50">{fout}</p>
        </div>
      )}

      {lijst.length === 0 && !fout ? (
        <LegeStaat
          titel="Geen openstaande follow-ups"
          omschrijving="Plan er een vanaf een leadpagina, of leg een belgesprek vast op de bellijst."
        />
      ) : (
        <div className="space-y-6">
          {TIJDVAKKEN.map((tv) => {
            const rijen = groepen[tv.key];
            if (rijen.length === 0) return null;
            return (
              <section key={tv.key}>
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <h2 className="text-sm font-medium text-navy">{tv.label}</h2>
                  <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy/70">
                    {rijen.length}
                  </span>
                  <span className="text-xs text-navy/40">{tv.uitleg}</span>
                </div>
                <Kaart className="p-0">
                  <ul className="divide-y divide-navy/5">
                    {rijen.map((f) => (
                      <FollowupRij key={f.id} f={f} />
                    ))}
                  </ul>
                </Kaart>
              </section>
            );
          })}
        </div>
      )}

      {/* Het stille lek: leads die nergens meer op de rol staan */}
      <section className="mt-8">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-medium text-navy">Zonder follow-up</h2>
          {zonder.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              {zonder.length}
            </span>
          )}
          <span className="text-xs text-navy/40">
            Open leads waar niets meer voor gepland staat — de stilste bovenaan.
          </span>
        </div>
        <Kaart className="p-0">
          <ZonderFollowup leads={zonder} />
        </Kaart>
      </section>

      <p className="mt-6 text-xs text-navy/40">
        Peildatum: {vandaag}. Verzetten schuift alleen de datum op; afronden vraagt
        meteen om de volgende afspraak, zodat een lead niet stilletjes uit de
        cyclus valt.
      </p>
    </>
  );
}
