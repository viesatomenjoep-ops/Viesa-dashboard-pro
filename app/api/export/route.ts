import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { naarCsv } from "@/lib/csv";
import { leadStatusLabel, type Lead } from "@/lib/leads";

export const dynamic = "force-dynamic";

/**
 * Export van documenten voor de boekhouding (CSV) en leads (echte .xlsx —
 * opent zonder omzetting in zowel Excel als Numbers).
 * `?type=facturen|offertes|klanten|maandomzet|leads`. Vereist ingelogde sessie (RLS).
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ fout: "Niet ingelogd." }, { status: 401 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "facturen";

  if (type === "leads") {
    return exporteerLeadsXlsx(supabase);
  }
  if (type === "leads-contact") {
    return exporteerLeadsContactXlsx(supabase);
  }

  let kolommen: string[] = [];
  let rijen: unknown[][] = [];
  let bestand = "export.csv";

  if (type === "facturen") {
    bestand = "facturen.csv";
    kolommen = ["Nummer", "Klant", "Status", "Bedrag excl", "Btw %", "Factuurdatum", "Vervaldatum", "Betaald op"];
    const { data } = await supabase
      .from("facturen")
      .select("nummer, klant, status, bedrag, btw_percentage, factuurdatum, vervaldatum, betaald_op")
      .order("factuurdatum", { ascending: false });
    rijen = (data ?? []).map((f) => [
      f.nummer, f.klant, f.status, f.bedrag, f.btw_percentage, f.factuurdatum, f.vervaldatum, f.betaald_op,
    ]);
  } else if (type === "offertes") {
    bestand = "offertes.csv";
    kolommen = ["Nummer", "Titel", "Klant", "Status", "Bedrag", "Verzonden op", "Aangemaakt"];
    const { data } = await supabase
      .from("offertes")
      .select("nummer, titel, klant, status, bedrag, verzonden_op, created_at")
      .order("created_at", { ascending: false });
    rijen = (data ?? []).map((o) => [
      o.nummer, o.titel, o.klant, o.status, o.bedrag, o.verzonden_op, o.created_at?.slice(0, 10),
    ]);
  } else if (type === "klanten") {
    bestand = "klanten.csv";
    kolommen = ["Bedrijf", "Contact", "E-mail", "Telefoon", "Stad", "Land", "Branche", "Type"];
    const { data } = await supabase
      .from("klanten")
      .select("bedrijf, contact_naam, email, telefoon, stad, land, branche, type")
      .order("bedrijf");
    rijen = (data ?? []).map((k) => [
      k.bedrijf, k.contact_naam, k.email, k.telefoon, k.stad, k.land, k.branche, k.type,
    ]);
  } else if (type === "maandomzet") {
    bestand = "maandomzet.csv";
    kolommen = ["Maand", "Omzet"];
    const { data } = await supabase.from("omzet_per_maand").select("maand, omzet").order("maand");
    rijen = (data ?? []).map((r) => [String(r.maand).slice(0, 7), r.omzet]);
  } else {
    return NextResponse.json({ fout: "Onbekend type." }, { status: 400 });
  }

  const csv = naarCsv(kolommen, rijen);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bestand}"`,
    },
  });
}

const LEAD_KOLOMMEN: { key: keyof Lead; label: string }[] = [
  { key: "bedrijf", label: "Bedrijf" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score" },
  { key: "verwachte_waarde", label: "Verwachte waarde" },
  { key: "bron", label: "Bron" },
  { key: "plaats", label: "Plaats" },
  { key: "adres", label: "Adres" },
  { key: "provincie", label: "Provincie" },
  { key: "land", label: "Land" },
  { key: "website", label: "Website" },
  { key: "contact_naam", label: "Contactpersoon" },
  { key: "voornaam", label: "Voornaam" },
  { key: "achternaam", label: "Achternaam" },
  { key: "functie", label: "Functie" },
  { key: "seniority", label: "Seniority" },
  { key: "afdeling", label: "Afdeling" },
  { key: "email", label: "E-mail" },
  { key: "telefoon", label: "Telefoon" },
  { key: "telefoon_contact", label: "Direct telefoonnr" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter/X" },
  { key: "it_aanbod", label: "IT-aanbod" },
  { key: "platform", label: "Platform" },
  { key: "branche", label: "Branche" },
  { key: "bedrijfsgrootte", label: "Bedrijfsgrootte" },
  { key: "aantal_medewerkers", label: "Aantal medewerkers" },
  { key: "rating_google", label: "Google rating" },
  { key: "aantal_reviews", label: "Aantal reviews" },
  { key: "openingszin", label: "Openingszin" },
  { key: "notities", label: "Notities" },
  { key: "created_at", label: "Aangemaakt op" },
];

/**
 * Strakke contactlijst-export van alle leads (.xlsx) met precies 5 kolommen:
 * Naam bedrijf, Plaats, Website, Contactpersoon, E-mail.
 */
async function exporteerLeadsContactXlsx(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("leads")
    .select("bedrijf, plaats, website, contact_naam, voornaam, achternaam, email")
    .order("bedrijf", { ascending: true });
  if (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

  const kolommen = ["Naam bedrijf", "Plaats", "Website", "Contactpersoon", "E-mail"];
  const rijen = (data ?? []).map((l) => ({
    "Naam bedrijf": l.bedrijf ?? "",
    Plaats: l.plaats ?? "",
    Website: l.website ?? "",
    Contactpersoon:
      l.contact_naam ??
      [l.voornaam, l.achternaam].filter(Boolean).join(" ") ??
      "",
    "E-mail": l.email ?? "",
  }));

  const werkblad = XLSX.utils.json_to_sheet(rijen, { header: kolommen });
  // Kolombreedtes voor een nette spreadsheet.
  werkblad["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 34 }, { wch: 26 }, { wch: 30 }];
  const werkboek = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(werkboek, werkblad, "Leads");
  const buffer = XLSX.write(werkboek, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads-contactlijst.xlsx"`,
    },
  });
}

/** Echte .xlsx-export van alle leads — opent zonder omzetting in Excel én Numbers. */
async function exporteerLeadsXlsx(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ fout: error.message }, { status: 500 });
  }

  const leads = (data ?? []) as Lead[];
  const rijen = leads.map((lead) => {
    const rij: Record<string, unknown> = {};
    for (const { key, label } of LEAD_KOLOMMEN) {
      const waarde = lead[key];
      rij[label] =
        key === "status"
          ? leadStatusLabel(lead.status)
          : key === "created_at" && typeof waarde === "string"
            ? waarde.slice(0, 10)
            : (waarde ?? "");
    }
    return rij;
  });

  const werkblad = XLSX.utils.json_to_sheet(rijen, {
    header: LEAD_KOLOMMEN.map((k) => k.label),
  });
  const werkboek = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(werkboek, werkblad, "Leads");
  const buffer = XLSX.write(werkboek, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads.xlsx"`,
    },
  });
}
