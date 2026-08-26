"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { AuditAntwoord, GebundeldeConcurrent } from "./VisibilityAuditView";

/**
 * Het PDF-rapport dat naar de prospect gaat.
 *
 * Vier pagina's met een oplopende spanningsboog: dit is wie je bent → dit is
 * wie je níét ziet → dit zijn de bedrijven die jouw plek innemen → dit is hoe
 * je dat omdraait. De cijfers doen het overtuigwerk; de tekst blijft zakelijk.
 *
 * react-pdf kent geen Tailwind, dus de huisstijl staat hieronder als
 * StyleSheet — navy #19445B, dezelfde kleuren als het dashboard.
 */

const NAVY = "#19445B";
const ROOD = "#B91C1C";
const GROEN = "#047857";
const GRIJS = "#64748B";
const LICHT = "#F4F6F9";

const s = StyleSheet.create({
  pagina: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontSize: 11,
    color: NAVY,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
  },
  // Cover
  coverMerk: { fontSize: 13, fontFamily: "Times-Bold", color: NAVY },
  coverLijn: { borderBottomWidth: 2, borderBottomColor: NAVY, marginTop: 10, marginBottom: 120 },
  coverTitel: { fontSize: 34, fontFamily: "Times-Bold", color: NAVY, lineHeight: 1.2 },
  coverSub: { fontSize: 14, color: GRIJS, marginTop: 14 },
  coverUrl: { fontSize: 20, fontFamily: "Times-Bold", color: NAVY, marginTop: 34 },
  coverNiche: { fontSize: 12, color: GRIJS, marginTop: 6 },
  coverVoet: { position: "absolute", bottom: 48, left: 52, right: 52, fontSize: 9, color: GRIJS },

  // Inhoud
  kop: { fontSize: 20, fontFamily: "Times-Bold", color: NAVY, marginBottom: 6 },
  inleiding: { fontSize: 11, color: GRIJS, marginBottom: 22 },
  alinea: { marginBottom: 11 },

  waarschuwing: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 3,
    borderLeftColor: ROOD,
    padding: 14,
    marginBottom: 22,
  },
  waarschuwingKop: { fontSize: 13, fontFamily: "Times-Bold", color: ROOD, marginBottom: 5 },
  waarschuwingTekst: { fontSize: 11, color: "#7F1D1D" },

  rij: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 9,
  },
  rijNaam: { fontSize: 12, fontFamily: "Times-Bold" },
  rijMerk: { fontSize: 9, color: GRIJS },
  labelRood: { fontSize: 10, fontFamily: "Times-Bold", color: ROOD },
  labelGroen: { fontSize: 10, fontFamily: "Times-Bold", color: GROEN },
  labelGrijs: { fontSize: 10, color: GRIJS },

  nummer: { width: 22, fontSize: 12, fontFamily: "Times-Bold", color: GRIJS },
  concurrentNaam: { fontSize: 12, fontFamily: "Times-Bold" },
  concurrentUrl: { fontSize: 9, color: GRIJS },
  genoemd: { fontSize: 9, color: GRIJS },

  stap: { flexDirection: "row", marginBottom: 13 },
  stapNr: {
    width: 20,
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: NAVY,
  },
  stapTekst: { flex: 1, fontSize: 11 },
  stapKop: { fontFamily: "Times-Bold" },

  cta: { backgroundColor: LICHT, padding: 18, marginTop: 26 },
  ctaKop: { fontSize: 13, fontFamily: "Times-Bold", marginBottom: 5 },

  voet: {
    position: "absolute",
    bottom: 34,
    left: 52,
    right: 52,
    fontSize: 8,
    color: GRIJS,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 7,
  },
});

const MODELLEN = [
  { key: "openai", label: "ChatGPT", merk: "OpenAI" },
  { key: "anthropic", label: "Claude", merk: "Anthropic" },
  { key: "gemini", label: "Gemini", merk: "Google" },
  { key: "perplexity", label: "Perplexity", merk: "Perplexity" },
] as const;

function Voettekst({ url }: { url: string }) {
  return (
    <Text
      style={s.voet}
      render={({ pageNumber, totalPages }) =>
        `AI Visibility Audit — ${url}   ·   Viesa Automations   ·   ${pageNumber}/${totalPages}`
      }
      fixed
    />
  );
}

export function AuditPDFDocument({
  audit,
  concurrenten,
  bedrijfsnaam,
}: {
  audit: AuditAntwoord;
  concurrenten: GebundeldeConcurrent[];
  bedrijfsnaam?: string;
}) {
  const host = audit.target_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const naam = bedrijfsnaam?.trim() || host;

  const gelukt = MODELLEN.filter((m) => audit[m.key].success);
  const negeren = gelukt.filter((m) => !audit[m.key].target_found);
  const vinden = gelukt.filter((m) => audit[m.key].target_found);
  const datum = new Date().toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`AI Visibility Audit — ${host}`}
      author="Viesa Automations"
      subject={`Zichtbaarheid in AI-modellen voor ${audit.niche_keyword}`}
    >
      {/* ---- Pagina 1: cover ---- */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.coverMerk}>VIESA AUTOMATIONS</Text>
        <View style={s.coverLijn} />

        <Text style={s.coverTitel}>AI Visibility{"\n"}Audit</Text>
        <Text style={s.coverSub}>
          Word jij aanbevolen wanneer een klant het aan AI vraagt?
        </Text>

        <Text style={s.coverUrl}>{naam}</Text>
        <Text style={s.coverNiche}>Onderzocht op: {audit.niche_keyword}</Text>

        <Text style={s.coverVoet}>
          Opgesteld op {datum} · Getoetst bij ChatGPT, Claude, Gemini en Perplexity
        </Text>
      </Page>

      {/* ---- Pagina 2: wie negeert je ---- */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.kop}>Wat de modellen antwoorden</Text>
        <Text style={s.inleiding}>
          We hebben vier taalmodellen gevraagd welke bedrijven zij aanraden voor
          &quot;{audit.niche_keyword}&quot;. Hieronder staat per model of {naam} in
          dat antwoord voorkwam.
        </Text>

        {negeren.length > 0 && (
          <View style={s.waarschuwing}>
            <Text style={s.waarschuwingKop}>
              {negeren.length} van de {gelukt.length} modellen noemt {naam} niet
            </Text>
            <Text style={s.waarschuwingTekst}>
              {negeren.map((m) => m.label).join(", ")} raadt andere bedrijven aan.
              Wie via een van deze modellen zoekt, komt bij een concurrent uit —
              zonder dat u het merkt, want zo iemand belandt nooit op uw website
              en verschijnt dus ook niet in uw statistieken.
            </Text>
          </View>
        )}

        {MODELLEN.map((m) => {
          const r = audit[m.key];
          return (
            <View key={m.key} style={s.rij}>
              <View>
                <Text style={s.rijNaam}>{m.label}</Text>
                <Text style={s.rijMerk}>{m.merk}</Text>
              </View>
              {!r.success ? (
                <Text style={s.labelGrijs}>Geen antwoord</Text>
              ) : r.target_found ? (
                <Text style={s.labelGroen}>Gevonden — u bent zichtbaar</Text>
              ) : (
                <Text style={s.labelRood}>Niet gevonden — u wordt genegeerd</Text>
              )}
            </View>
          );
        })}

        {vinden.length > 0 && (
          <Text style={[s.alinea, { marginTop: 22 }]}>
            Positief: {vinden.map((m) => m.label).join(" en ")}{" "}
            {vinden.length === 1 ? "noemt" : "noemen"} {naam} wél. Dat bewijst dat
            de basis er is — het is een kwestie van die zichtbaarheid uitbreiden
            naar de rest.
          </Text>
        )}

        <Voettekst url={host} />
      </Page>

      {/* ---- Pagina 3: de concurrenten ---- */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.kop}>Wie uw plek inneemt</Text>
        <Text style={s.inleiding}>
          Deze bedrijven worden wél aanbevolen in uw niche. Hoe vaker een naam
          terugkomt bij verschillende modellen, hoe steviger die positie is.
        </Text>

        {concurrenten.length === 0 ? (
          <Text style={s.alinea}>
            De modellen leverden geen bruikbare lijst op. Dat komt voor bij zeer
            specifieke of nieuwe zoektermen — een breder zoekwoord geeft meestal
            wel resultaat.
          </Text>
        ) : (
          concurrenten.slice(0, 5).map((c, i) => (
            <View key={`${c.host}-${i}`} style={s.rij}>
              <Text style={s.nummer}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.concurrentNaam}>{c.name}</Text>
                {c.host ? <Text style={s.concurrentUrl}>{c.host}</Text> : null}
              </View>
              <Text style={s.genoemd}>
                {c.aantal}× genoemd
              </Text>
            </View>
          ))
        )}

        <Text style={[s.alinea, { marginTop: 24, color: GRIJS, fontSize: 10 }]}>
          Deze namen komen uit de antwoorden van de modellen zelf, niet uit een
          door ons samengestelde lijst. Ze weerspiegelen wat een klant te zien
          krijgt die vandaag om een aanbeveling vraagt.
        </Text>

        <Voettekst url={host} />
      </Page>

      {/* ---- Pagina 4: wat eraan te doen is ---- */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.kop}>Hoe u dit omdraait</Text>
        <Text style={s.inleiding}>
          Taalmodellen halen hun aanbevelingen uit tekst die ze op het web
          tegenkomen. Generative Engine Optimization (GEO) zorgt dat die tekst er
          is, en dat uw bedrijf erin voorkomt als het feitelijke antwoord op de
          vraag van de klant.
        </Text>

        {[
          {
            kop: "Zichtbaar worden in de bron",
            tekst:
              "Modellen citeren pagina's die een vraag concreet en controleerbaar beantwoorden. Wij schrijven die pagina's: feitelijk, met cijfers, zonder verkooppraat — precies het materiaal waar een model op vertrouwt.",
          },
          {
            kop: "Autoriteit opbouwen die te verifiëren is",
            tekst:
              "Een claim zonder onderbouwing wordt overgeslagen. Cases met meetbare uitkomsten, duidelijke vermelding van uw werkgebied en consistente bedrijfsgegevens maken van uw site een betrouwbare bron.",
          },
          {
            kop: "Meten en bijsturen",
            tekst:
              "Deze audit is de nulmeting. We herhalen hem elk kwartaal, zodat u zwart-op-wit ziet bij welke modellen u erbij komt — en waar er nog werk ligt.",
          },
        ].map((stap, i) => (
          <View key={i} style={s.stap}>
            <Text style={s.stapNr}>{i + 1}.</Text>
            <Text style={s.stapTekst}>
              <Text style={s.stapKop}>{stap.kop}. </Text>
              {stap.tekst}
            </Text>
          </View>
        ))}

        <View style={s.cta}>
          <Text style={s.ctaKop}>De volgende stap</Text>
          <Text>
            We lopen dit rapport graag in een half uur met u door en laten zien
            welke pagina&apos;s het snelst effect hebben voor {naam}. Daar zit
            geen verplichting aan vast.
          </Text>
          <Text style={{ marginTop: 11, fontFamily: "Times-Bold" }}>
            Viesa Automations · contact@viesa-automations.nl · +31 83 052 875
          </Text>
        </View>

        <Voettekst url={host} />
      </Page>
    </Document>
  );
}
