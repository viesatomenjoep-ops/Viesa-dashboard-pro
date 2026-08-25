/**
 * Bellijst zonder AI — rangschikt zelf wie er vandaag gebeld moet worden.
 *
 * De vraag "wie bellen we vandaag, op score, waarde en laatste contact" is
 * rekenwerk, geen taalbegrip. Dat door een taalmodel laten doen kost geld, kan
 * omvallen op een verlopen sleutel, en geeft bij dezelfde invoer niet altijd
 * hetzelfde antwoord. Deze module doet het lokaal: gratis, meteen, en elke keer
 * reproduceerbaar.
 *
 * De AI blijft bruikbaar als aanvulling — die schrijft rakere gesprekspunten.
 * Maar de lijst zelf hangt er niet meer van af (zie lib/ai/bellijst.ts).
 *
 * De weging staat hieronder expliciet, zodat je kunt zien én bijstellen waarom
 * een lead bovenaan staat.
 */

export type BelKandidaat = {
  id: string;
  bedrijf: string | null;
  plaats: string | null;
  status: string | null;
  score: number | null;
  verwachte_waarde: number | null;
  contact_naam: string | null;
  telefoon: string | null;
  telefoon_contact: string | null;
  branche: string | null;
  it_aanbod: string | null;
  notities: string | null;
  bel_notitie?: string | null;
  laatst_gebeld: string | null;
  belpogingen?: number | null;
  updated_at: string | null;
};

export type LokaleSuggestie = {
  lead_id: string;
  bedrijf: string;
  prioriteit: "hoog" | "middel" | "laag";
  reden: string;
  gesprekspunten: string[];
};

/** Hoeveel elk onderdeel maximaal meetelt. Samen 105, min de strafpunten. */
const WEGING = {
  score: 40, // kwaliteit van de lead
  waarde: 25, // verwachte omzet
  stilte: 25, // hoe lang geleden contact
  status: 15, // hoe ver in de pipeline
  strafPerPoging: 4, // wie steeds niet opneemt, zakt
};

/** Pipelinestatus → gewicht. Hoe dichter bij tekenen, hoe urgenter. */
const STATUS_GEWICHT: Record<string, number> = {
  onderhandeling: 15,
  offerte: 14,
  offerte_verstuurd: 14,
  gekwalificeerd: 11,
  contact: 9,
  nieuw: 7,
  koud: 4,
  verloren: 0,
  gewonnen: 0,
};

function dagenSinds(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.floor(ms / 86_400_000);
}

export function telefoonVan(l: BelKandidaat): string | null {
  return l.telefoon_contact || l.telefoon || null;
}

/**
 * Berekent de punten van één lead, plus de reden die het zwaarst meewoog.
 * De reden komt uit de werkelijke berekening — geen los verzonnen zinnetje.
 */
function beoordeel(l: BelKandidaat): { punten: number; reden: string } {
  const onderdelen: { punten: number; zin: string }[] = [];

  const score = Math.max(0, Math.min(100, l.score ?? 0));
  onderdelen.push({
    punten: (score / 100) * WEGING.score,
    zin: `score ${score}`,
  });

  // Logaritmisch: één uitschieter mag de hele lijst niet overnemen.
  const waarde = Math.max(0, Number(l.verwachte_waarde ?? 0));
  const waardePunten = waarde > 0
    ? Math.min(WEGING.waarde, Math.log10(1 + waarde / 100) * 10)
    : 0;
  onderdelen.push({
    punten: waardePunten,
    zin: waarde > 0 ? `waarde € ${Math.round(waarde).toLocaleString("nl-NL")}` : "",
  });

  // Stilte telt zwaar: een goede lead die je laat liggen koelt af.
  const dagen = dagenSinds(l.laatst_gebeld) ?? dagenSinds(l.updated_at);
  const stiltePunten = dagen === null
    ? WEGING.stilte * 0.6 // nooit gebeld: urgent, maar niet automatisch bovenaan
    : Math.min(WEGING.stilte, dagen * 0.5);
  onderdelen.push({
    punten: stiltePunten,
    zin:
      l.laatst_gebeld === null
        ? "nog nooit gebeld"
        : dagen === null
          ? ""
          : `${dagen} dagen geen contact`,
  });

  const status = (l.status ?? "").toLowerCase();
  const statusPunten = STATUS_GEWICHT[status] ?? 6;
  onderdelen.push({
    punten: statusPunten,
    zin: status ? `staat op ${status.replace(/_/g, " ")}` : "",
  });

  const pogingen = Math.max(0, Number(l.belpogingen ?? 0));
  const straf = pogingen * WEGING.strafPerPoging;

  const punten = onderdelen.reduce((s, o) => s + o.punten, 0) - straf;

  // De twee zwaarste onderdelen vormen de reden.
  const reden = onderdelen
    .filter((o) => o.zin)
    .sort((a, b) => b.punten - a.punten)
    .slice(0, 2)
    .map((o) => o.zin)
    .join(", ");

  return {
    punten,
    reden: reden ? reden.charAt(0).toUpperCase() + reden.slice(1) + "." : "Staat open.",
  };
}

/** Bouwt drie gesprekspunten uit wat we werkelijk over deze lead weten. */
function gesprekspunten(l: BelKandidaat): string[] {
  const punten: string[] = [];

  // Wat jij zelf hebt genoteerd gaat voor alles.
  const eigen = (l.bel_notitie ?? "").trim();
  if (eigen) {
    eigen
      .split("\n")
      .map((r) => r.replace(/^\s*[•\-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 2)
      .forEach((r) => punten.push(r));
  }

  const dagen = dagenSinds(l.laatst_gebeld);
  if (l.laatst_gebeld === null) {
    punten.push("Eerste contact — vraag hoe hun orderverwerking nu loopt.");
  } else if (dagen !== null && dagen > 30) {
    punten.push(`Ruim ${Math.floor(dagen / 30)} maand geleden gesproken — vraag wat er sindsdien veranderd is.`);
  } else if (dagen === 0) {
    punten.push("Vandaag al gesproken — alleen bellen als er iets nieuws is.");
  } else if (dagen !== null) {
    punten.push(
      `${dagen} ${dagen === 1 ? "dag" : "dagen"} geleden gesproken — kom terug op wat toen bleef liggen.`,
    );
  }

  if (l.branche) {
    punten.push(`Branche ${l.branche}: noem wat je bij een vergelijkbaar bedrijf hebt opgelost.`);
  }
  if (l.it_aanbod) {
    punten.push(`Eerder besproken: ${l.it_aanbod}.`);
  }

  const waarde = Number(l.verwachte_waarde ?? 0);
  if (waarde > 0) {
    punten.push(
      `Verwachte waarde € ${Math.round(waarde).toLocaleString("nl-NL")} — genoeg om een afspraak voor in te plannen.`,
    );
  }

  const notitie = (l.notities ?? "").trim();
  if (notitie) punten.push(notitie.slice(0, 120));

  punten.push("Vraag waar het handwerk zit tussen bestelling en boekhouding.");

  return punten.slice(0, 3);
}

/**
 * Rangschikt de belbare leads en levert de beste `maxAantal` op.
 * Leads zonder telefoonnummer vallen af — je kunt ze niet bellen.
 */
export function rangschikBelkandidaten(
  leads: BelKandidaat[],
  maxAantal = 8,
): LokaleSuggestie[] {
  return leads
    .filter(telefoonVan)
    .map((l) => ({ lead: l, ...beoordeel(l) }))
    .sort((a, b) => b.punten - a.punten)
    .slice(0, maxAantal)
    .map(({ lead, punten, reden }) => ({
      lead_id: lead.id,
      bedrijf: lead.bedrijf ?? "Onbekend bedrijf",
      prioriteit: punten >= 60 ? "hoog" : punten >= 40 ? "middel" : "laag",
      reden,
      gesprekspunten: gesprekspunten(lead),
    }));
}
