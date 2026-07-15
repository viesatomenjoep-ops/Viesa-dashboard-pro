import Link from "next/link";

/**
 * KPI-kaart: klein label + groot cijfer. KPI's staan altijd bovenaan de pagina.
 * Zet `accent` op true om er (spaarzaam!) één oranje te benadrukken.
 * Geef `href` mee om de kaart klikbaar te maken (bv. om de lijst te filteren).
 */
export function KpiKaart({
  label,
  waarde,
  subtekst,
  accent = false,
  href,
}: {
  label: string;
  waarde: string;
  subtekst?: string;
  accent?: boolean;
  href?: string;
}) {
  const basis = `block rounded-xl border bg-white p-5 shadow-sm ${
    accent ? "border-oranje/40" : "border-navy/10"
  }`;

  const inhoud = (
    <>
      <p className="text-sm text-navy/60">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold ${
          accent ? "text-oranje" : "text-navy"
        }`}
      >
        {waarde}
      </p>
      {subtekst && <p className="mt-1 text-xs text-navy/50">{subtekst}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${basis} transition-colors hover:border-navy/30 hover:bg-navy/[0.02]`}
      >
        {inhoud}
      </Link>
    );
  }

  return <div className={basis}>{inhoud}</div>;
}
