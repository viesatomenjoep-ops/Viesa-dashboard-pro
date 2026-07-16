/**
 * Kleurhelpers voor de Haze-redesign. Navy + teal blijven het merk-accent;
 * het statuspalet (groen/amber/rood/blauw/paars) mag alléén voor labels,
 * avatars, categorieën en grafieken — nooit voor grote vlakken.
 * Zie design-systems/huisstijl.md en redesign-conceptplan.md.
 */

/** Hex-waarden voor grafieken (Recharts kan geen Tailwind-klassen gebruiken). */
export const CHART = {
  navy: "#19445B",
  teal: "#1E9E93",
  groen: "#10B981",
  amber: "#F59E0B",
  rood: "#EF4444",
  blauw: "#3B82F6",
  paars: "#8B5CF6",
} as const;

/** Kleurenreeks voor grafieken met meerdere series/segmenten. */
export const CHART_REEKS: string[] = [
  CHART.teal,
  CHART.blauw,
  CHART.amber,
  CHART.paars,
  CHART.groen,
  CHART.rood,
];

/**
 * Palet met Tailwind-klassenparen (achtergrond + tekst) voor avatars en
 * categorie-labels. Deterministisch gekozen op basis van de tekst, zodat
 * dezelfde naam/categorie altijd dezelfde kleur krijgt.
 */
const LABEL_PALET: string[] = [
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-amber-100 text-amber-800",
  "bg-purple-100 text-purple-800",
  "bg-navy/10 text-navy",
  "bg-oranje/15 text-oranje",
];

/** Stabiele, kleine hash van een tekst (djb2-achtig). */
function hash(tekst: string): number {
  let h = 0;
  for (let i = 0; i < tekst.length; i++) h = (h * 31 + tekst.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Achtergrond+tekst-klassen voor een avatar, afgeleid van de naam. */
export function avatarKleur(naam: string): string {
  if (!naam?.trim()) return "bg-navy/10 text-navy";
  return LABEL_PALET[hash(naam) % LABEL_PALET.length];
}

/** Achtergrond+tekst-klassen voor een categorie/branche-label. */
export function categorieKleur(waarde: string): string {
  if (!waarde?.trim()) return "bg-navy/5 text-navy/60";
  return LABEL_PALET[hash(waarde) % LABEL_PALET.length];
}

/** Tot twee initialen uit een naam of bedrijfsnaam. */
export function initialen(naam: string): string {
  const delen = (naam ?? "").trim().split(/\s+/).filter(Boolean);
  if (delen.length === 0) return "?";
  if (delen.length === 1) return delen[0].slice(0, 2).toUpperCase();
  return (delen[0][0] + delen[delen.length - 1][0]).toUpperCase();
}
