"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ScanRapport } from "@/lib/scan";

/**
 * PDF-versie van een bewaard scanrapport (zie website_prototypes... nee,
 * activiteiten.data — het rapport dat via "Push naar lead" is opgeslagen).
 * Zelfde huisstijl als AuditPDFDocument.tsx: navy, Times-serie, geen Tailwind.
 */

const NAVY = "#19445B";
const ROOD = "#B91C1C";
const GROEN = "#047857";
const AMBER = "#B45309";
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
  coverMerk: { fontSize: 13, fontFamily: "Times-Bold", color: NAVY },
  coverLijn: { borderBottomWidth: 2, borderBottomColor: NAVY, marginTop: 10, marginBottom: 40 },
  coverTitel: { fontSize: 30, fontFamily: "Times-Bold", color: NAVY, lineHeight: 1.2 },
  coverUrl: { fontSize: 16, fontFamily: "Times-Bold", color: NAVY, marginTop: 18 },
  coverVoet: { position: "absolute", bottom: 48, left: 52, right: 52, fontSize: 9, color: GRIJS },

  scoreBlok: { flexDirection: "row", alignItems: "center", marginTop: 30, marginBottom: 30 },
  scoreCijfer: { fontSize: 48, fontFamily: "Times-Bold" },
  scoreLabel: { fontSize: 14, fontFamily: "Times-Bold", marginLeft: 18 },

  kop: { fontSize: 18, fontFamily: "Times-Bold", color: NAVY, marginBottom: 12 },
  onderdeelRij: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
  },
  onderdeelNaam: { fontSize: 12 },
  onderdeelCijfer: { fontSize: 12, fontFamily: "Times-Bold" },

  bevindingRij: { flexDirection: "row", marginBottom: 10 },
  bevindingBol: { width: 14, fontSize: 11, fontFamily: "Times-Bold" },
  bevindingTitel: { fontSize: 11, fontFamily: "Times-Bold" },
  bevindingUitleg: { fontSize: 10, color: GRIJS, marginTop: 1 },
  bevindingAdvies: { fontSize: 10, color: NAVY, marginTop: 2 },

  cta: { backgroundColor: LICHT, padding: 16, marginTop: 20 },

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

function kleurVoorScore(score: number): string {
  if (score >= 75) return GROEN;
  if (score >= 50) return AMBER;
  return ROOD;
}

function oordeelVoorScore(score: number): string {
  if (score >= 75) return "Goed zichtbaar";
  if (score >= 50) return "Matig zichtbaar";
  return "Vrijwel onzichtbaar";
}

function Voettekst({ host }: { host: string }) {
  return (
    <Text
      style={s.voet}
      render={({ pageNumber, totalPages }) => `Websitescan — ${host}   ·   Viesa Automations   ·   ${pageNumber}/${totalPages}`}
      fixed
    />
  );
}

export function ScanPDFDocument({ rapport }: { rapport: ScanRapport }) {
  const kleur = kleurVoorScore(rapport.totaalScore);
  const oordeel = oordeelVoorScore(rapport.totaalScore);
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const gemist = rapport.geo.bevindingen.filter((b) => !b.goed);
  const gehaald = rapport.geo.bevindingen.filter((b) => b.goed);

  return (
    <Document title={`Websitescan — ${rapport.host}`} author="Viesa Automations">
      {/* Pagina 1: cover + totaaloordeel */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.coverMerk}>VIESA AUTOMATIONS</Text>
        <View style={s.coverLijn} />
        <Text style={s.coverTitel}>Websitescan</Text>
        <Text style={s.coverUrl}>{rapport.host}</Text>
        <Text style={{ fontSize: 10, color: GRIJS, marginTop: 4 }}>Opgesteld op {datum}</Text>

        <View style={s.scoreBlok}>
          <Text style={[s.scoreCijfer, { color: kleur }]}>{rapport.totaalScore}</Text>
          <Text style={[s.scoreLabel, { color: kleur }]}>{oordeel}</Text>
        </View>

        <Text style={s.kop}>Drie metingen</Text>
        <View style={s.onderdeelRij}>
          <Text style={s.onderdeelNaam}>AI-zichtbaarheid</Text>
          <Text style={s.onderdeelCijfer}>
            {rapport.zichtbaarheid.score !== null
              ? `${rapport.zichtbaarheid.score}/100 (${rapport.zichtbaarheid.gevonden}/${rapport.zichtbaarheid.getest} modellen)`
              : "niet gemeten"}
          </Text>
        </View>
        <View style={s.onderdeelRij}>
          <Text style={s.onderdeelNaam}>GEO-gereedheid</Text>
          <Text style={s.onderdeelCijfer}>{rapport.geo.score}/100</Text>
        </View>
        <View style={s.onderdeelRij}>
          <Text style={s.onderdeelNaam}>Techniek (PageSpeed)</Text>
          <Text style={s.onderdeelCijfer}>
            {rapport.techniek.score !== null ? `${rapport.techniek.score}/100` : "niet gemeten"}
          </Text>
        </View>

        <View style={s.cta}>
          <Text style={{ fontSize: 13, fontFamily: "Times-Bold", marginBottom: 5 }}>De volgende stap</Text>
          <Text>
            We lopen dit rapport graag in een half uur door en laten zien welke punten het snelst
            effect hebben voor {rapport.host}.
          </Text>
          <Text style={{ marginTop: 11, fontFamily: "Times-Bold" }}>
            Viesa Automations · contact@viesa-automations.nl · +31 83 052 875
          </Text>
        </View>

        <Voettekst host={rapport.host} />
      </Page>

      {/* Pagina 2: bevindingen */}
      <Page size="A4" style={s.pagina}>
        <Text style={s.kop}>Te verbeteren</Text>
        {gemist.length === 0 ? (
          <Text style={{ fontSize: 11, color: GRIJS }}>Alle gecontroleerde punten staan goed.</Text>
        ) : (
          gemist.map((b, i) => (
            <View key={i} style={s.bevindingRij}>
              <Text style={[s.bevindingBol, { color: b.ernst === "kritiek" ? ROOD : AMBER }]}>
                {b.ernst === "kritiek" ? "!" : "•"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={s.bevindingTitel}>{b.titel}</Text>
                <Text style={s.bevindingUitleg}>{b.uitleg}</Text>
                <Text style={s.bevindingAdvies}>→ {b.advies}</Text>
              </View>
            </View>
          ))
        )}

        {gehaald.length > 0 && (
          <>
            <Text style={[s.kop, { marginTop: 24 }]}>Wat al goed staat</Text>
            {gehaald.map((b, i) => (
              <View key={i} style={s.bevindingRij}>
                <Text style={[s.bevindingBol, { color: GROEN }]}>✓</Text>
                <Text style={s.bevindingTitel}>{b.titel}</Text>
              </View>
            ))}
          </>
        )}

        <Voettekst host={rapport.host} />
      </Page>
    </Document>
  );
}
