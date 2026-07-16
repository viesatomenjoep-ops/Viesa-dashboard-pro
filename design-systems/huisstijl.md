# Huisstijl — Viesa Automations

## Kleuren

| Rol            | Kleur      | Hex       | Tailwind-token   |
| -------------- | ---------- | --------- | ---------------- |
| Primair        | Navy       | `#19445B` | `navy`           |
| Accent         | Teal       | `#1E9E93` | `oranje`\*       |
| Achtergrond    | Lichtgrijs | `#F4F6F9` | `achtergrond`    |
| Kaart / vlak   | Wit        | `#FFFFFF` | `white`          |

\* Het accent-token heet historisch `oranje` maar bevat teal `#1E9E93`. De
klassenaam blijft behouden zodat het accent op één plek te wijzigen is.

### Statuspalet (labels & grafieken)

Sinds de Haze-redesign (zie `redesign-conceptplan.md`) mag kleur rijker worden
ingezet — **alleen** voor statuspillen, categorie-/branchelabels en grafieken,
nooit voor grote vlakken.

| Betekenis                      | Kleur  |
| ------------------------------ | ------ |
| Goed / betaald / actief        | Groen  |
| In behandeling / pending / let op | Amber  |
| Risico / verlopen / inactief   | Rood   |
| Info / nieuw                   | Blauw  |
| Extra categorie / segment      | Paars  |

### Regels

- **Navy** is de primaire kleur: koppen, tekst, navigatie, randen (transparant).
- **Teal** (`oranje`-token) is het merk-accent: primaire knoppen, actief item,
  één belangrijk cijfer. Niet voor grote vlakken.
- **Achtergrond** `#F4F6F9` is de paginabachtergrond; kaarten zijn wit.
- Het **statuspalet** hierboven is de enige toegestane uitbreiding; geen extra
  merkkleuren toevoegen zonder afstemming.

## Typografie

- Systeem-/Inter-sans-serif, rustige gewichten (regular / medium / semibold).
- Koppen in navy; secundaire tekst in navy met verlaagde opacity (`text-navy/60`).

## Taal

- Alle UI-teksten zijn in het **Nederlands**.
