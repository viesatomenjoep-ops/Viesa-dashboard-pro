/**
 * Categorieën (migratie 0024 + 0026). Herbruikbare, opslaanbare keuzelijsten die
 * in de werkruimte gedeeld worden. Een vrij ingetypte waarde wordt direct een
 * echte categorie — daarom zijn de velden datalist-comboboxen: kies bestaand of
 * typ nieuw. Bij opslaan worden nieuwe waarden in de `categorieen`-tabel gezet.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type CategorieSoort =
  | "it_aanbod"
  | "platform"
  | "bestand_type"
  | "branche"
  | "bedrijfsgrootte";

export const CATEGORIE_SOORTEN: { key: CategorieSoort; label: string }[] = [
  { key: "it_aanbod", label: "IT-aanbod" },
  { key: "platform", label: "Platform" },
  { key: "branche", label: "Branche" },
  { key: "bedrijfsgrootte", label: "Bedrijfsgrootte" },
  { key: "bestand_type", label: "Bestandstype" },
];

/**
 * Standaardwaarden die de migraties seeden. Dienen als fallback zodat de
 * dropdowns ook gevuld zijn wanneer de `categorieen`-tabel nog leeg is, en als
 * vaste minimumlijst. De echte lijst uit de database wordt hiermee samengevoegd.
 */
export const CATEGORIE_SEED: Record<CategorieSoort, string[]> = {
  platform: [
    "Shopify",
    "WooCommerce",
    "Magento",
    "Lightspeed",
    "CCV Shop",
    "Shopware",
    "PrestaShop",
    "Wix",
    "Squarespace",
    "Maatwerk / custom",
    "Onbekend",
  ],
  it_aanbod: [
    "Webshop-integratie",
    "Voorraadkoppeling",
    "Order-automatisering",
    "Boekhoudkoppeling",
    "E-mail- & marketingautomatisering",
    "Data-dashboard",
    "API-koppeling",
    "AI-chatbot",
  ],
  bestand_type: ["Drive", "Sheet", "Doc", "Map", "PDF", "Overig"],
  branche: [
    "E-commerce / webshop",
    "Groothandel",
    "Retail / detailhandel",
    "Productie / fabrikant",
    "Horeca",
    "Bouw & installatie",
    "Transport & logistiek",
    "Zakelijke dienstverlening",
    "Gezondheidszorg",
    "Overig",
  ],
  bedrijfsgrootte: [
    "Kleine ondernemer / ZZP",
    "MKB",
    "MKB-plus",
    "Groothandel",
    "Grootbedrijf / corporate",
  ],
};

type CategorieRij = { soort: CategorieSoort; waarde: string };

/**
 * Haalt alle categorieën op en groepeert ze per soort, samengevoegd met de
 * seed-lijst (uniek, alfabetisch). Faalt de query (tabel bestaat nog niet), dan
 * vallen we terug op alleen de seed zodat de UI blijft werken.
 */
export async function haalCategorieen(
  supabase: SupabaseClient,
): Promise<Record<CategorieSoort, string[]>> {
  const resultaat: Record<CategorieSoort, string[]> = {
    it_aanbod: [],
    platform: [],
    bestand_type: [],
    branche: [],
    bedrijfsgrootte: [],
  };
  let rijen: CategorieRij[] = [];
  try {
    const { data } = await supabase
      .from("categorieen")
      .select("soort, waarde")
      .order("waarde", { ascending: true });
    rijen = (data ?? []) as CategorieRij[];
  } catch {
    // tabel ontbreekt nog — alleen seed gebruiken
  }
  for (const soort of Object.keys(resultaat) as CategorieSoort[]) {
    const uitDb = rijen.filter((r) => r.soort === soort).map((r) => r.waarde);
    resultaat[soort] = Array.from(
      new Set([...(CATEGORIE_SEED[soort] ?? []), ...uitDb]),
    ).sort((a, b) => a.localeCompare(b, "nl"));
  }
  return resultaat;
}

/**
 * Slaat vrij ingetypte categoriewaarden op als echte categorieën, zodat ze de
 * volgende keer in de dropdown staan. Onbekende/lege waarden worden overgeslagen.
 * `onConflict` op (soort, waarde) maakt het idempotent.
 */
export async function bewaarCategorieWaarden(
  supabase: SupabaseClient,
  paren: { soort: CategorieSoort; waarde: string | null }[],
): Promise<void> {
  const rijen = paren
    .filter((p): p is { soort: CategorieSoort; waarde: string } => !!p.waarde?.trim())
    .map((p) => ({ soort: p.soort, waarde: p.waarde.trim() }));
  if (rijen.length === 0) return;
  try {
    await supabase.from("categorieen").upsert(rijen, { onConflict: "soort,waarde" });
  } catch {
    // categorieën-tabel ontbreekt nog — stil overslaan, de waarde staat al op de rij
  }
}
