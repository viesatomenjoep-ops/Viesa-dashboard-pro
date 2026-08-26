# Merkpakket — Viesa Automations

Eén bron voor de klantgerichte huisstijl. Wijzig kleuren en maten **hier**, niet
in losse componenten.

## Wat hier staat

| Bestand      | Waarvoor                                                        |
| ------------ | --------------------------------------------------------------- |
| `tokens.json`| Machineleesbaar. Bedoeld voor de Brand Factory op de Mac.        |
| `tokens.css` | Dezelfde waarden als CSS-variabelen, op de klasse `.viesa-merk`. |

De twee worden handmatig gelijkgehouden. Wijzig je een kleur, doe het in
allebei — het zijn er weinig genoeg om dat betrouwbaar te doen, en een
bouwstap ertussen zou de Brand Factory afhankelijk maken van deze repo.

## Waarom `.viesa-merk` en niet `:root`

Het interne dashboard houdt zijn eigen thema (navy + teal + koel grijs `#F4F6F9`,
Inter). Dit merkpakket is de **klantgerichte** stijl: warm zand, terracotta als
enige accent, Archivo. Twee verschillende werelden die niet in elkaars vaarwater
moeten zitten.

Zet de klasse dus op de buitenste laag van een document:

```tsx
import { merkKlassen } from "@/lib/rapport/fonts";

<div className={`rap ${merkKlassen}`}>…</div>
```

`merkKlassen` bevat `viesa-merk` plus de twee lettertypevariabelen.

## De kleuren

| Rol         | Waarde    | Gebruik                                              |
| ----------- | --------- | ---------------------------------------------------- |
| Navy        | `#19445B` | Primair — koppen, knoppen, randen                     |
| Diepnavy    | `#111D36` | Donkere vlakken — omslag, voettekst                   |
| Terracotta  | `#E2603F` | **Het enige accent.** Betekent "Viesa", nooit "fout". |
| Zand        | `#F3F0E9` | Paginabachtergrond                                    |
| Zanddiep    | `#EEEBE2` | Ingezonken vlak — tabelkop, oordeelblok               |
| Lijn        | `#E4E1D8` | Haarlijn. **Geen zebra** in tabellen.                 |

Daarnaast een apart **signaalpalet** (`--goed`, `--beter`, `--nodig`, `--geen`,
elk met een `-vlak`-variant). Dat staat los van het accent: een rood vlak
betekent "aandacht nodig", terracotta betekent "Viesa". Die twee door elkaar
halen maakt elk rapport onleesbaar.

Op donkere vlakken is de lichte tekstkleur **zand `#F3F0E9`**, niet zuiver wit —
zo houdt het geheel zijn warmte.

## De lettertypen

- **Archivo** (400–900) — koppen en lopende tekst
- **IBM Plex Mono** (400–600) — bovenkopjes in kapitalen, en **alle meetwaarden**,
  zodat cijfers in kolommen onder elkaar uitlijnen

Ze worden geladen met `next/font` (zie `lib/rapport/fonts.ts`), niet met een
`<link>` naar Google Fonts. Reden: bij afdrukken naar PDF is een extern
lettertype soms nog niet binnen op het moment dat de browser de pagina opmaakt,
en dan valt de hele PDF terug op een systeemletter.

## Het logo

`public/viesa-hex.png` plus de wordmark, samen in `components/rapport/Merkregel.tsx`.
De opmaak komt uit de landingspagina: **VIESA** in gewicht 800, **AUTOMATIONS**
in gewicht 500 en een gedempt blauw ernaast.

## Voor de Brand Factory

`tokens.json` is zo opgezet dat een render-sjabloon er direct uit kan lezen:
elke kleur heeft een `waarde` én een `rol`, zodat een sjabloon niet hoeft te
raden welke kleur waarvoor bedoeld is. Lettertypen staan met hun gewichten en
een terugvalstapel, zodat een render niet stilletjes op een andere letter
uitkomt als Archivo lokaal ontbreekt.
