"use client";

/**
 * Het vangnet onder het klantrapport.
 *
 * Zonder dit toont Next bij een fout de kale Engelse regel "Application error:
 * a client-side exception has occurred" op een wit vlak. Dat is precies wat een
 * prospect níét mag zien in een document dat wij hem toestuurden: het leest als
 * een kapotte site van óns, terwijl het over de zijne gaat.
 *
 * Hier staat in plaats daarvan een nette Nederlandse melding met een uitweg —
 * opnieuw proberen, of ons mailen.
 */

import { CONTACT_MAIL } from "@/lib/rapport/contact";

export default function RapportFout({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#F3F0E9",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: "34rem", textAlign: "center", color: "#19445B" }}>
        <p
          style={{
            fontSize: ".72rem",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#146E67",
            fontWeight: 700,
          }}
        >
          Viesa Automations
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: 12, lineHeight: 1.25 }}>
          Dit rapport kon niet worden opgebouwd
        </h1>
        <p style={{ marginTop: 12, lineHeight: 1.6, color: "#4A6377" }}>
          Er ging iets mis bij het inladen van de meting. De scan zelf is niet
          verloren — probeer het opnieuw, of laat het ons weten dan sturen we u
          het rapport rechtstreeks toe.
        </p>
        <div
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#19445B",
              color: "#F3F0E9",
              border: 0,
              borderRadius: 999,
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
          <a
            href={`mailto:${CONTACT_MAIL}`}
            style={{
              border: "1px solid rgba(25,68,91,.25)",
              color: "#19445B",
              borderRadius: 999,
              padding: "12px 24px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {CONTACT_MAIL}
          </a>
        </div>
      </div>
    </main>
  );
}
