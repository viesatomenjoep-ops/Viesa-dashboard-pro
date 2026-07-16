import Image from "next/image";

// Verhouding van public/viesa-logo.png (1443×1600).
const RATIO = 1600 / 1443;

/**
 * Viesa-logo — toont het echte bestand `public/viesa-logo.png` (navy hexagon
 * met witte V op transparant).
 *
 * `variant="wit"` plaatst het op een witte tegel, zodat het navy-logo ook op
 * een donkere achtergrond (zijbalk/banner) zichtbaar blijft. Het logo zelf
 * wordt niet aangepast.
 */
export function Logo({
  size = 40,
  variant = "navy",
  className = "",
}: {
  size?: number;
  variant?: "navy" | "wit" | "navytegel";
  className?: string;
}) {
  const img = (
    <Image
      src="/viesa-logo.png"
      width={size}
      height={Math.round(size * RATIO)}
      alt="Viesa"
      priority
      className={className}
    />
  );

  if (variant === "wit") {
    return (
      <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5">
        {img}
      </span>
    );
  }
  // Navy tegel op donkere achtergrond: dezelfde blauwtint als de zijbalk met een
  // fijne witte rand, zodat het logo groot en met minimale rand toch afgebakend blijft.
  if (variant === "navytegel") {
    return (
      <span className="inline-flex items-center justify-center rounded-xl bg-navy p-1 ring-1 ring-white/25">
        {img}
      </span>
    );
  }
  return img;
}
