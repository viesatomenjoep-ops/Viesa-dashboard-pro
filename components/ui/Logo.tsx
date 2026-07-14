import Image from "next/image";

/**
 * Viesa-logo — toont het ECHTE logobestand `public/viesa-logo.png`
 * (niet nagetekend/bewerkt). Upload dat bestand één keer naar /public.
 *
 * `variant="wit"` plaatst het logo op een witte tegel, zodat het navy-logo
 * ook op een donkere achtergrond (zijbalk/banner) zichtbaar blijft — het logo
 * zelf wordt niet aangepast.
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
  const img = (
    <Image
      src="/viesa-logo.png"
      width={size}
      height={size}
      alt="Viesa"
      priority
      className={className}
      style={{ height: "auto", width: size }}
    />
  );

  if (variant === "wit") {
    return (
      <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5">
        {img}
      </span>
    );
  }
  return img;
}
