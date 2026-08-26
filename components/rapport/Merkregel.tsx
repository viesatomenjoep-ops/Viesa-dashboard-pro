import Image from "next/image";

/**
 * Het logo-lockup van Viesa: het hexlogo naast de wordmark.
 *
 * Overgenomen uit de landingspagina (`Viesa Landing Page.dc.html`, voettekst):
 * VIESA in gewicht 800, AUTOMATIONS in gewicht 500 en een gedempt blauw
 * ernaast. Op donkere vlakken is de tekstkleur zand `#F3F0E9` — niet zuiver
 * wit, dat vloekt met de warme huisstijl.
 */
export function Merkregel({
  toon = "donker",
  hoogte = 34,
}: {
  /** `donker` = op een navy vlak (lichte tekst), `licht` = op zand (navy tekst). */
  toon?: "donker" | "licht";
  hoogte?: number;
}) {
  const donker = toon === "donker";
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Image
        src="/viesa-hex.png"
        alt=""
        width={hoogte}
        height={hoogte}
        style={{ height: hoogte, width: hoogte, objectFit: "contain" }}
      />
      <span
        style={{
          fontWeight: 800,
          fontSize: hoogte * 0.47,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          color: donker ? "#F3F0E9" : "var(--navy)",
        }}
      >
        VIESA
        <span style={{ fontWeight: 500, color: donker ? "#8FA1BD" : "var(--zacht)" }}>
          {" "}
          AUTOMATIONS
        </span>
      </span>
    </span>
  );
}
