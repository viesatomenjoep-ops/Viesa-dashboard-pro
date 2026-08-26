"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LeadBron, LeadStatus } from "@/lib/leads";
import type { ActiviteitType } from "@/lib/activiteiten";
import { bewaarCategorieWaarden } from "@/lib/categorieen";
import { zoekLeadsViaGoogleMaps } from "@/lib/apify";
import { zoekLeadsViaGooglePlaces } from "@/lib/google-places";
import { zoekLeadsViaOpenStreetMap } from "@/lib/openstreetmap";
import { zoekLeadsViaGoogleZoeken } from "@/lib/google-search";
import { zoekLeadsViaClaude } from "@/lib/ai/lead-zoeker";
import { verrijkLead } from "@/lib/ai/verrijking";
import { bouwStatischPrototype, type DesignStijl, type PrototypeType } from "@/lib/website-sjabloon";
import { haalEchteContent } from "@/lib/site-scrape";
import type { ScanRapport } from "@/lib/scan";

/** Snel een lead toevoegen — alleen bedrijf is verplicht. */
export async function maakLead(formData: FormData) {
  const bedrijf = String(formData.get("bedrijf") ?? "").trim();
  if (!bedrijf) {
    redirect("/leads?fout=" + encodeURIComponent("Bedrijf is verplicht."));
  }
  const supabase = createClient();
  const { error } = await supabase.from("leads").insert({
    bedrijf,
    plaats: leeg(formData.get("plaats")),
    website: leeg(formData.get("website")),
    status: "nieuw",
    bron: "handmatig",
  });
  if (error) redirect("/leads?fout=" + encodeURIComponent(error.message));
  revalidatePath("/leads");
  redirect("/leads");
}

/**
 * Maakt van een lead een klant (type prospect) met de leadgegevens en koppelt
 * de lead aan die klant (klant_id). Bestond er al een koppeling, dan gaan we
 * naar die klant.
 */
export async function maakKlantVanLead(leadId: string) {
  const supabase = createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (!lead) redirect("/leads");

  if (lead.klant_id) redirect(`/klanten/${lead.klant_id}`);

  const { data: klant, error } = await supabase
    .from("klanten")
    .insert({
      bedrijf: lead.bedrijf,
      contact_naam: lead.contact_naam ?? null,
      email: lead.email ?? null,
      telefoon: lead.telefoon ?? null,
      website: lead.website ?? null,
      stad: lead.plaats ?? null,
      type: "prospect",
    })
    .select("id")
    .single();
  if (error || !klant) {
    redirect(`/leads/${leadId}?fout=` + encodeURIComponent(error?.message ?? "Mislukt."));
  }

  await supabase.from("leads").update({ klant_id: klant.id }).eq("id", leadId);
  revalidatePath("/klanten");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/klanten/${klant.id}`);
}

export async function werkLeadBij(id: string, formData: FormData) {
  const supabase = createClient();
  const it_aanbod = leeg(formData.get("it_aanbod"));
  const platform = leeg(formData.get("platform"));
  const branche = leeg(formData.get("branche"));
  const bedrijfsgrootte = leeg(formData.get("bedrijfsgrootte"));
  const { error } = await supabase
    .from("leads")
    .update({
      bedrijf: String(formData.get("bedrijf") ?? "").trim(),
      plaats: leeg(formData.get("plaats")),
      website: leeg(formData.get("website")),
      contact_naam: leeg(formData.get("contact_naam")),
      email: leeg(formData.get("email")),
      telefoon: leeg(formData.get("telefoon")),
      bron: (String(formData.get("bron") ?? "handmatig") || "handmatig") as LeadBron,
      status: (String(formData.get("status") ?? "nieuw") || "nieuw") as LeadStatus,
      score: Number(formData.get("score") ?? 0),
      verwachte_waarde: Number(formData.get("verwachte_waarde") ?? 0),
      openingszin: leeg(formData.get("openingszin")),
      notities: leeg(formData.get("notities")),
      // geo
      land: leeg(formData.get("land")) ?? "Nederland",
      provincie: leeg(formData.get("provincie")),
      // categorie
      it_aanbod,
      platform,
      // Google-Places
      adres: leeg(formData.get("adres")),
      place_id: leeg(formData.get("place_id")),
      rating_google: getal(formData.get("rating_google")),
      aantal_reviews: geheelGetal(formData.get("aantal_reviews")),
      // contactpersoon
      voornaam: leeg(formData.get("voornaam")),
      achternaam: leeg(formData.get("achternaam")),
      functie: leeg(formData.get("functie")),
      seniority: leeg(formData.get("seniority")),
      afdeling: leeg(formData.get("afdeling")),
      linkedin: leeg(formData.get("linkedin")),
      twitter: leeg(formData.get("twitter")),
      telefoon_contact: leeg(formData.get("telefoon_contact")),
      // kwalificatie
      branche,
      bedrijfsgrootte,
      aantal_medewerkers: geheelGetal(formData.get("aantal_medewerkers")),
    })
    .eq("id", id);
  if (error) redirect(`/leads/${id}?fout=` + encodeURIComponent(error.message));
  await bewaarCategorieWaarden(supabase, [
    { soort: "it_aanbod", waarde: it_aanbod },
    { soort: "platform", waarde: platform },
    { soort: "branche", waarde: branche },
    { soort: "bedrijfsgrootte", waarde: bedrijfsgrootte },
  ]);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?opgeslagen=1`);
}

/** Verplaatst een lead naar een andere kolom/positie (drag & drop). */
export async function verplaatsLead(
  id: string,
  status: LeadStatus,
  positie: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status, positie })
    .eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function verwijderLead(id: string) {
  const supabase = createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
  redirect("/leads");
}

/** Zet een lead op/af de bellijst (leads die we gaan bellen). */
export async function zetOpBellijst(id: string, aan: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("leads").update({ bellen: aan }).eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/bellen");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

/** Toggle voor de bellijst als form-actie (geeft niets terug). */
export async function wisselBellijst(id: string, aan: boolean): Promise<void> {
  const supabase = createClient();
  await supabase.from("leads").update({ bellen: aan }).eq("id", id);
  revalidatePath("/bellen");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

// `markeerGebeld` is vervallen: een gesprek wordt nu vastgelegd met
// `legGesprekVast` in app/(app)/bellen/acties.ts, dat óók de uitkomst, een
// activiteit en een follow-up wegschrijft in plaats van alleen een datum.

/** Bewaart de bel-notitie bij een lead. */
export async function bewaarBelNotitie(id: string, formData: FormData) {
  const notitie = String(formData.get("bel_notitie") ?? "").trim() || null;
  const supabase = createClient();
  await supabase.from("leads").update({ bel_notitie: notitie }).eq("id", id);
  revalidatePath("/bellen");
  revalidatePath(`/leads/${id}`);
}

/** Werkt alleen de score van een lead bij (inline autosave). */
export async function werkLeadScore(id: string, score: number) {
  const veilig = Math.max(0, Math.min(100, Math.round(score)));
  const supabase = createClient();
  const { error } = await supabase.from("leads").update({ score: veilig }).eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

/** Laat de verrijkings-agent (#2) een score + kwalificatie voorstellen. */
export async function stelVerrijkingVoor(leadId: string) {
  const supabase = createClient();
  return verrijkLead(supabase, leadId);
}

// De AI-prototypegenerator is bewust verwijderd: hij kostte tokens en het
// resultaat haalde het niet bij de branchesjablonen hieronder (0 tokens).

/**
 * Laadt direct (0 tokens) een prototype op basis van het branchesjabloon — het
 * standaardpad in de UI. Geen AI-aanroep, dus ook geen wachttijd of kosten.
 * `branche` overschrijft desgewenst de branche van de lead, zodat je per lead
 * elk sjabloon kunt uitproberen.
 */
export async function laadSjabloonPrototype(
  leadId: string,
  type: PrototypeType = "website",
  branche?: string,
  stijl?: DesignStijl,
): Promise<{ ok: boolean; id?: string; html?: string; fout?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("bedrijf, plaats, branche, website")
    .eq("id", leadId)
    .single();
  if (error || !data) return { ok: false, fout: error?.message ?? "Lead niet gevonden." };

  // Best-effort: echte foto/tekst van de bestaande site, nog steeds 0 tokens
  // (puur een fetch + parsing). Lukt het niet — traag, geen website, blokkeert
  // bots — dan valt het gewoon terug op het generieke branchesjabloon.
  const echt = data.website ? await haalEchteContent(data.website) : null;

  const html = bouwStatischPrototype({
    bedrijf: data.bedrijf ?? "Dit bedrijf",
    plaats: data.plaats,
    branche: branche?.trim() || data.branche,
    type,
    stijl: stijl ?? null,
    echt,
  });

  const { data: rij } = await supabase
    .from("website_prototypes")
    .insert({ lead_id: leadId, type, bron: "sjabloon", html })
    .select("id")
    .single();

  revalidatePath(`/leads/${leadId}`);
  return { ok: true, id: rij?.id, html };
}

/** Verwijdert een bewaard prototype (sjabloon of AI) van een lead. */
export async function verwijderPrototype(
  id: string,
  leadId: string,
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("website_prototypes").delete().eq("id", id);
  if (error) return { ok: false, fout: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/** Past gekozen verrijkingsvelden toe op de lead (bevestigingsstap). */
export async function pasVerrijkingToe(
  leadId: string,
  velden: {
    score?: number;
    branche?: string | null;
    bedrijfsgrootte?: string | null;
    it_aanbod?: string | null;
    openingszin?: string | null;
  },
): Promise<{ ok: boolean; fout?: string }> {
  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (typeof velden.score === "number")
    update.score = Math.max(0, Math.min(100, Math.round(velden.score)));
  if (velden.branche !== undefined) update.branche = velden.branche;
  if (velden.bedrijfsgrootte !== undefined) update.bedrijfsgrootte = velden.bedrijfsgrootte;
  if (velden.it_aanbod !== undefined) update.it_aanbod = velden.it_aanbod;
  if (velden.openingszin !== undefined) update.openingszin = velden.openingszin;
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("leads").update(update).eq("id", leadId);
  if (error) return { ok: false, fout: error.message };
  await bewaarCategorieWaarden(supabase, [
    { soort: "it_aanbod", waarde: velden.it_aanbod ?? null },
    { soort: "branche", waarde: velden.branche ?? null },
    { soort: "bedrijfsgrootte", waarde: velden.bedrijfsgrootte ?? null },
  ]);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

/** Maakt een activiteit bij een lead. */
export async function maakActiviteit(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: (String(formData.get("type") ?? "notitie") || "notitie") as ActiviteitType,
    titel: leeg(formData.get("titel")),
    omschrijving: leeg(formData.get("omschrijving")),
  });
  revalidatePath(`/leads/${leadId}`);
}

/**
 * Zet een voltooide websitescan als rapport in het activiteitenlog van een
 * lead — een bewuste keuze van de gebruiker, geen automatisch gedrag bij elke
 * scan. Bewaart het volledige resultaat (data), zodat de PDF later opnieuw
 * gegenereerd kan worden zonder de scan te herhalen.
 */
export async function pushScanRapportNaarLead(
  leadId: string,
  resultaat: ScanRapport,
): Promise<{ ok: boolean; fout?: string }> {
  if (!leadId) return { ok: false, fout: "Geen lead gekozen." };
  const supabase = createClient();
  const oordeel =
    resultaat.totaalScore >= 75
      ? "Goed zichtbaar"
      : resultaat.totaalScore >= 50
        ? "Matig zichtbaar"
        : "Vrijwel onzichtbaar";
  const { error } = await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: "rapport",
    titel: `Websitescan — score ${resultaat.totaalScore}`,
    omschrijving: `${resultaat.host} · ${oordeel}`,
    status: "afgerond",
    afgerond_op: new Date().toISOString(),
    data: resultaat,
  });
  if (error) return { ok: false, fout: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

/** Plant een follow-up (activiteit type follow_up met datum). */
export async function planFollowup(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("activiteiten").insert({
    lead_id: leadId,
    type: "follow_up",
    titel: leeg(formData.get("titel")) ?? "Follow-up",
    follow_up_datum: leeg(formData.get("follow_up_datum")),
    status: "open",
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/** Belnotitie: een notitie (notities-tabel) gekoppeld aan een lead. */
export async function maakLeadNotitie(leadId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from("notities").insert({
    lead_id: leadId,
    titel: String(formData.get("titel") ?? "Belnotitie").trim() || "Belnotitie",
    inhoud_markdown: String(formData.get("inhoud_markdown") ?? ""),
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function verwijderLeadNotitie(id: string, leadId: string) {
  const supabase = createClient();
  await supabase.from("notities").delete().eq("id", id);
  revalidatePath(`/leads/${leadId}`);
}

export async function rondActiviteitAf(id: string, leadId: string) {
  const supabase = createClient();
  await supabase
    .from("activiteiten")
    .update({ status: "afgerond", afgerond_op: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/** Bulk-import van leads (rijen uit Excel/CSV). Alleen rijen met een bedrijf. */
export async function importeerLeads(
  rijen: Record<string, string>[],
): Promise<{ aantal: number; fout?: string }> {
  const schoon = rijen
    .map((r) => {
      const score = Number(r.score ?? 0);
      const waarde = Number((r.verwachte_waarde ?? "").replace(",", "."));
      return {
        bedrijf: (r.bedrijf ?? "").trim(),
        plaats: r.plaats || r.stad || null,
        website: r.website || null,
        contact_naam: r.contact_naam || null,
        email: r.email || null,
        telefoon: r.telefoon || null,
        score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0,
        verwachte_waarde: Number.isFinite(waarde) ? waarde : 0,
        status: "nieuw" as const,
        // Geïmporteerde leads herkenbaar maken (0023: bron-check kent 'import').
        bron: "import" as const,
        // geo + categorie (0024)
        land: r.land || "Nederland",
        provincie: r.provincie || null,
        it_aanbod: r.it_aanbod || null,
        platform: r.platform || null,
        // Google-Places (0023)
        adres: r.adres || null,
        place_id: r.place_id || null,
        rating_google: teksNaarGetal(r.rating_google),
        aantal_reviews: teksNaarGeheel(r.aantal_reviews),
        // contactpersoon (0023)
        voornaam: r.voornaam || null,
        achternaam: r.achternaam || null,
        functie: r.functie || null,
        seniority: r.seniority || null,
        afdeling: r.afdeling || null,
        linkedin: r.linkedin || null,
        twitter: r.twitter || null,
        telefoon_contact: r.telefoon_contact || null,
        // kwalificatie (0026)
        branche: r.branche || null,
        bedrijfsgrootte: r.bedrijfsgrootte || null,
        aantal_medewerkers: teksNaarGeheel(r.aantal_medewerkers),
      };
    })
    .filter((r) => r.bedrijf.length > 0);

  if (schoon.length === 0) return { aantal: 0, fout: "Geen geldige rijen (bedrijf ontbreekt)." };
  const supabase = createClient();
  const { error } = await supabase.from("leads").insert(schoon);
  if (error) return { aantal: 0, fout: error.message };
  await bewaarCategorieWaarden(supabase, [
    ...schoon.map((r) => ({ soort: "it_aanbod" as const, waarde: r.it_aanbod })),
    ...schoon.map((r) => ({ soort: "platform" as const, waarde: r.platform })),
    ...schoon.map((r) => ({ soort: "branche" as const, waarde: r.branche })),
    ...schoon.map((r) => ({ soort: "bedrijfsgrootte" as const, waarde: r.bedrijfsgrootte })),
  ]);
  revalidatePath("/leads");
  return { aantal: schoon.length };
}

/** Zoekt bedrijven via Google Maps (Apify of Google Places) en slaat nieuwe als lead op. Bestaande place_id's slaat hij over. */
/**
 * De prospector-bronnen. Ze leveren allemaal dezelfde rij op (ProspectRij), dus
 * de rest van deze functie — ontdubbelen, invoegen, loggen — is voor elke bron
 * gelijk. Een bron erbij zetten raakt alleen deze tabel en zijn eigen bestand.
 */
type ProspectorBron = "apify" | "places" | "osm" | "zoeken" | "claude";

const BRON_LABEL: Record<ProspectorBron, string> = {
  apify: "Apify",
  places: "Google Places",
  osm: "OpenStreetMap",
  zoeken: "Google Zoeken",
  claude: "Claude",
};

/** Zoals de bron in prospector_runs wordt vastgelegd. */
const BRON_SLEUTEL: Record<ProspectorBron, string> = {
  apify: "google-maps",
  places: "google-places",
  osm: "openstreetmap",
  zoeken: "google-zoeken",
  claude: "claude-websearch",
};

function leesBron(waarde: FormDataEntryValue | null): ProspectorBron {
  const s = String(waarde ?? "");
  return s in BRON_LABEL ? (s as ProspectorBron) : "apify";
}

export async function zoekLeadsGoogleMaps(formData: FormData): Promise<{ aantal: number; overgeslagen: number; fout?: string }> {
  const zoekterm = String(formData.get("zoekterm") ?? "").trim();
  const locatie = String(formData.get("locatie") ?? "").trim();
  const maxResultaten = Number(formData.get("max_resultaten") ?? 20);
  const metContactverrijking = formData.get("met_contactverrijking") === "on";
  const bron = leesBron(formData.get("bron"));

  if (!zoekterm || !locatie) {
    return { aantal: 0, overgeslagen: 0, fout: "Zoekterm en locatie zijn verplicht." };
  }

  const supabase = createClient();
  const max = Number.isFinite(maxResultaten) ? maxResultaten : 20;

  let gevonden;
  try {
    switch (bron) {
      case "osm":
        gevonden = await zoekLeadsViaOpenStreetMap({ zoekterm, locatie, maxResultaten: max });
        break;
      case "zoeken":
        gevonden = await zoekLeadsViaGoogleZoeken({ zoekterm, locatie, maxResultaten: max });
        break;
      case "claude":
        gevonden = await zoekLeadsViaClaude({ zoekterm, locatie, maxResultaten: max });
        break;
      case "places":
        gevonden = await zoekLeadsViaGooglePlaces({ zoekterm, locatie, maxResultaten: max });
        break;
      default:
        gevonden = await zoekLeadsViaGoogleMaps({
          zoekterm,
          locatie,
          maxResultaten: max,
          metContactverrijking,
        });
    }
  } catch (e) {
    return {
      aantal: 0,
      overgeslagen: 0,
      fout: e instanceof Error ? e.message : `Zoekopdracht via ${BRON_LABEL[bron]} mislukt.`,
    };
  }

  const placeIds = gevonden.map((g) => g.place_id).filter((id): id is string => Boolean(id));
  const { data: bestaande } = placeIds.length
    ? await supabase.from("leads").select("place_id").in("place_id", placeIds)
    : { data: [] as { place_id: string | null }[] };
  const bekend = new Set((bestaande ?? []).map((b) => b.place_id));

  const nieuw = gevonden.filter((g) => !g.place_id || !bekend.has(g.place_id));
  const overgeslagen = gevonden.length - nieuw.length;

  const bronNaam = BRON_SLEUTEL[bron];

  if (nieuw.length === 0) {
    await supabase.from("prospector_runs").insert({
      bron: bronNaam,
      status: gevonden.length === 0 ? "mislukt" : "klaar",
      aantal_leads: 0,
      voltooid_op: new Date().toISOString(),
      details: { zoekterm, locatie, gevonden: gevonden.length, overgeslagen },
    });
    revalidatePath("/leads");
    return { aantal: 0, overgeslagen };
  }

  const { error } = await supabase.from("leads").insert(
    nieuw.map((l) => ({
      ...l,
      status: "nieuw" as const,
      bron: "prospector" as const,
    })),
  );

  await supabase.from("prospector_runs").insert({
    bron: bronNaam,
    status: error ? "mislukt" : "klaar",
    aantal_leads: error ? 0 : nieuw.length,
    voltooid_op: new Date().toISOString(),
    details: { zoekterm, locatie, gevonden: gevonden.length, overgeslagen, fout: error?.message },
  });

  if (error) return { aantal: 0, overgeslagen, fout: error.message };

  revalidatePath("/leads");
  return { aantal: nieuw.length, overgeslagen };
}

function leeg(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/** Kommagetal (bv. Google-rating) uit een formulierveld; null bij leeg/ongeldig. */
function getal(v: FormDataEntryValue | null): number | null {
  return teksNaarGetal(String(v ?? ""));
}

/** Geheel getal uit een formulierveld; null bij leeg/ongeldig. */
function geheelGetal(v: FormDataEntryValue | null): number | null {
  return teksNaarGeheel(String(v ?? ""));
}

function teksNaarGetal(s: string | undefined | null): number | null {
  const t = String(s ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function teksNaarGeheel(s: string | undefined | null): number | null {
  const n = teksNaarGetal(s);
  return n === null ? null : Math.round(n);
}
