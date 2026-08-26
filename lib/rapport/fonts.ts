import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * De lettertypen van de huisstijl (merk/tokens.json → "letter").
 *
 * Apart van app/layout.tsx: het interne dashboard houdt Inter, dit is alleen
 * voor de klantgerichte documenten. next/font zet ze zelf in de bundel, dus ze
 * werken ook in de afdrukweergave — waar een <link> naar Google Fonts soms nog
 * niet geladen is op het moment dat de browser de PDF opmaakt.
 */

export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** Zet deze klassen op de buitenste laag van een rapport of document. */
export const merkKlassen = `viesa-merk ${archivo.variable} ${plexMono.variable}`;
