/**
 * Follow-ups: types en indeling in tijdvakken.
 *
 * Een follow-up is een activiteit van type `follow_up` met een datum en status
 * `open`. Ze ontstaan bij het vastleggen van een belgesprek en op de leadpagina.
 *
 * Het zwakke punt van zo'n opzet is niet het plannen maar het uitvallen: een
 * lead waarvan de laatste follow-up is afgerond en waar niets nieuws voor in de
 * plaats komt, verdwijnt geruisloos. Daarom kent dit bestand naast de gewone
 * tijdvakken ook het begrip "zonder follow-up" — zie de /followups-pagina.
 */

export type Followup = {
  id: string;
  lead_id: string | null;
  titel: string | null;
  omschrijving: string | null;
  follow_up_datum: string | null;
  created_at: string;
  bedrijf: string | null;
  telefoon: string | null;
  email: string | null;
};

export type Tijdvak = "achterstallig" | "vandaag" | "deze_week" | "later";

export const TIJDVAKKEN: {
  key: Tijdvak;
  label: string;
  toon: "amber" | "oranje" | "navy" | "grijs";
  uitleg: string;
}[] = [
  {
    key: "achterstallig",
    label: "Achterstallig",
    toon: "amber",
    uitleg: "De datum is voorbij. Deze eerst.",
  },
  {
    key: "vandaag",
    label: "Vandaag",
    toon: "oranje",
    uitleg: "Vandaag aan de beurt.",
  },
  {
    key: "deze_week",
    label: "Deze week",
    toon: "navy",
    uitleg: "Komt er binnen zeven dagen aan.",
  },
  { key: "later", label: "Later", toon: "grijs", uitleg: "Staat verderop gepland." },
];

/** yyyy-mm-dd van vandaag, in lokale tijd. */
export function vandaagISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd over `n` dagen — voor de verzet-knoppen. */
export function overDagen(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** In welk tijdvak valt deze datum? Zonder datum: `later`. */
export function tijdvakVan(datum: string | null): Tijdvak {
  if (!datum) return "later";
  const vandaag = vandaagISO();
  if (datum < vandaag) return "achterstallig";
  if (datum === vandaag) return "vandaag";
  return datum <= overDagen(7) ? "deze_week" : "later";
}

/** Hoeveel dagen te laat? Nul of minder betekent: nog niet verstreken. */
export function dagenTeLaat(datum: string | null): number {
  if (!datum) return 0;
  const ms = new Date(vandaagISO()).getTime() - new Date(datum).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Groepeert follow-ups per tijdvak, met de vroegste datum eerst. */
export function perTijdvak(lijst: Followup[]): Record<Tijdvak, Followup[]> {
  const leeg: Record<Tijdvak, Followup[]> = {
    achterstallig: [],
    vandaag: [],
    deze_week: [],
    later: [],
  };
  for (const f of lijst) leeg[tijdvakVan(f.follow_up_datum)].push(f);
  for (const k of Object.keys(leeg) as Tijdvak[]) {
    leeg[k].sort((a, b) =>
      (a.follow_up_datum ?? "9999").localeCompare(b.follow_up_datum ?? "9999"),
    );
  }
  return leeg;
}

/** Een lead die aandacht verdient maar nergens meer op de rol staat. */
export type LeadZonderFollowup = {
  id: string;
  bedrijf: string | null;
  status: string | null;
  score: number | null;
  verwachte_waarde: number | null;
  laatst_gebeld: string | null;
  updated_at: string | null;
  telefoon: string | null;
};

/** Dagen sinds het laatste contact — gebruikt om de stilste bovenaan te zetten. */
export function dagenStil(l: LeadZonderFollowup): number {
  const bron = l.laatst_gebeld ?? l.updated_at;
  if (!bron) return 999;
  const ms = Date.now() - new Date(bron).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
