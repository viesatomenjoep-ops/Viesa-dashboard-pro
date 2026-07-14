/**
 * Viesa-beeldmerk als schaalbaar SVG: afgeronde hexagon met de "V" + pijl.
 * `variant`:
 *  - "navy"  → navy hexagon met witte mark (op lichte achtergrond)
 *  - "wit"   → witte hexagon met navy mark (op navy achtergrond)
 */
export function Logo({
  size = 40,
  variant = "navy",
  className = "",
}: {
  size?: number;
  variant?: "navy" | "wit";
  className?: string;
}) {
  const hex = variant === "navy" ? "#19445B" : "#FFFFFF";
  const mark = variant === "navy" ? "#FFFFFF" : "#19445B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 108"
      className={className}
      role="img"
      aria-label="Viesa"
    >
      <polygon
        points="50,7 90,31 90,77 50,101 10,77 10,31"
        fill={hex}
        stroke={hex}
        strokeWidth={13}
        strokeLinejoin="round"
      />
      {/* V — twee samenkomende strepen */}
      <path
        d="M31 33 L49 76"
        fill="none"
        stroke={mark}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M69 33 L52 76"
        fill="none"
        stroke={mark}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M44 33 L50 57"
        fill="none"
        stroke={mark}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* pijl onderaan */}
      <path d="M44 82 L50 71 L56 82 Z" fill={mark} />
    </svg>
  );
}
