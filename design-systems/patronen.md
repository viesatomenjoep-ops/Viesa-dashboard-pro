# UI-patronen

> Uitgebreid met de Haze-redesign — zie `redesign-conceptplan.md` voor het
> volledige verhaal en de nieuwe bouwstenen.

## KPI's

- KPI's staan **altijd bovenaan** de pagina, boven alle andere inhoud.
- Weergave als een rij witte kaarten (`StatKaart`): label (klein, navy/60),
  groot cijfer (navy, semibold), optioneel een Lucide-icoon in een gekleurd
  vlak, een trend-pil (+x% groen / −x% rood) en een mini-sparkline.
- Houd het accent spaarzaam: kleur zit vooral in het icoon-vlak en de trend-pil.

## Hero-banner

- Dashboards mogen bovenaan een `HeroBanner` tonen: een navy→teal gradient-vlak
  met een korte begroeting, kerncijfer(s) en één CTA-knop. Spaarzaam gebruiken.

## Statuspillen & labels

- Gebruik `StatusPill` met het statuspalet (groen/amber/rood/blauw/paars) voor
  status en categorie/branche. Afgerond, klein, gevulde pastel-achtergrond.
- Personen/klanten krijgen een `Avatar` (initialen in een van de naam afgeleide
  kleur).

## Grafieken

- Area-, donut-, gauge- en trechtergrafieken via Recharts, in navy/teal +
  statuspalet. Rustige assen, dunne lijnen, geen overbodige rasters.

## Tabellen

- **Geen zebra-strepen** (geen afwisselende rijkleuren).
- Rijen scheiden met een dunne, rustige rand (`border-navy/10`).
- Kop in navy, subtiel; celtekst in navy.
- Hover mag een zeer lichte navy-tint gebruiken, geen volle kleur.

## Knoppen

- Primaire actie: oranje achtergrond, witte tekst.
- Secundaire actie: witte/transparante achtergrond met navy tekst en rand.
- Houd het aantal oranje knoppen per scherm laag (accent, geen standaard).

## Layout

- Rustige, luchtige layout op achtergrond `#F4F6F9`.
- Inhoud gegroepeerd in witte kaarten met zachte schaduw en afgeronde hoeken.
