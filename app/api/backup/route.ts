import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Alle bekende tabellen; niet-bestaande tabellen worden netjes overgeslagen.
const TABELLEN = [
  "klanten", "leads", "activiteiten", "offertes", "facturen", "projecten",
  "notities", "project_notities", "audits", "sjablonen", "offerte_templates",
  "taken", "herinneringen", "agenda_bronnen", "agenda_activiteiten",
  "notificaties", "chat_berichten", "drive_links", "bestand_categorieen",
  "categorieen", "administratie", "emails", "email_bijlagen", "factuur_herinneringen",
  "whiteboards", "stickies", "sticky_notes", "design_docs", "design_documenten",
  "prospector_runs", "integraties", "ms_tokens",
];

/** Zet een waarde om naar een veilige SQL-literal. */
function sqlWaarde(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

/** Bouwt INSERT-statements voor één tabel. */
function insertSql(tabel: string, rijen: Record<string, unknown>[]): string {
  if (rijen.length === 0) return `-- ${tabel}: geen rijen\n`;
  const kolommen = Object.keys(rijen[0]);
  const kop = `-- ${tabel}: ${rijen.length} rijen\n`;
  const regels = rijen.map(
    (r) =>
      `INSERT INTO public.${tabel} (${kolommen.map((k) => `"${k}"`).join(", ")}) ` +
      `VALUES (${kolommen.map((k) => sqlWaarde(r[k])).join(", ")});`,
  );
  return kop + regels.join("\n") + "\n";
}

/**
 * Maakt een volledige back-up van de database als zip: het schema (alle
 * SQL-migraties) én de data (INSERT-statements per tabel). Alleen voor ingelogde
 * gebruikers. Handmatig te downloaden vanaf de Overig-pagina.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Niet ingelogd", { status: 401 });

  const zip = new JSZip();

  // 1) Schema — alle migratiebestanden.
  try {
    const dir = path.join(process.cwd(), "supabase", "migrations");
    const bestanden = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const f of bestanden) {
      zip.file(`schema/${f}`, await fs.readFile(path.join(dir, f), "utf8"));
    }
  } catch {
    zip.file("schema/LEESMIJ.txt", "Migratiebestanden niet leesbaar in deze omgeving.");
  }

  // 2) Data — per tabel INSERT-statements (RLS staat de ingelogde gebruiker toe).
  const overzicht: string[] = [];
  for (const tabel of TABELLEN) {
    try {
      const { data, error } = await supabase.from(tabel).select("*");
      if (error) {
        overzicht.push(`${tabel}: overgeslagen (${error.message})`);
        continue;
      }
      const rijen = (data ?? []) as Record<string, unknown>[];
      zip.file(`data/${tabel}.sql`, insertSql(tabel, rijen));
      overzicht.push(`${tabel}: ${rijen.length} rijen`);
    } catch {
      overzicht.push(`${tabel}: overgeslagen`);
    }
  }

  zip.file(
    "LEESMIJ.txt",
    [
      "Viesa Dashboard — volledige Supabase back-up",
      `Gemaakt op: ${new Date().toISOString()}`,
      "",
      "Map 'schema/' bevat alle SQL-migraties (het databaseschema).",
      "Map 'data/'   bevat per tabel INSERT-statements met alle rijen.",
      "",
      "Herstellen op een lege database: draai eerst de bestanden in 'schema/'",
      "op volgorde (0001, 0002, …), daarna de bestanden in 'data/'.",
      "",
      "Tabellen in deze back-up:",
      ...overzicht.map((r) => "  - " + r),
    ].join("\n"),
  );

  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  const stempel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="viesa-backup-${stempel}.zip"`,
    },
  });
}
