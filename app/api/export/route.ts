import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { naarCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * CSV-export van documenten voor de boekhouding.
 * `?type=facturen|offertes|klanten|maandomzet`. Vereist ingelogde sessie (RLS).
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
