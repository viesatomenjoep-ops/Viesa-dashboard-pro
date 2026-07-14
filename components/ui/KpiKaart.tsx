/**
 * KPI-kaart: klein label + groot cijfer. KPI's staan altijd bovenaan de pagina.
 * Zet `accent` op true om er (spaarzaam!) één oranje te benadrukken.
 */
export function KpiKaart({
  label,
  waarde,
  subtekst,
  accent = false,
}: {
  label: string;
  waarde: string;
  subtekst?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        accent ? "border-oranje/40" : "border-navy/10"
      }`}
    >
      <p className="text-sm text-navy/60">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold ${
          accent ? "text-oranje" : "text-navy"
        }`}
      >
        {waarde}
      </p>
      {subtekst && <p className="mt-1 text-xs text-navy/50">{subtekst}</p>}
    </div>
  );
}
