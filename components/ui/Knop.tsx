import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";

type Variant = "primair" | "secundair";

const basis =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";

const varianten: Record<Variant, string> = {
  // Primaire actie: oranje (accent, spaarzaam gebruiken)
  primair: "bg-oranje text-white hover:bg-oranje/90",
  // Secundaire actie: navy tekst met rand
  secundair: "border border-navy/20 text-navy hover:bg-navy/5",
};

/** Knop als <button>. */
export function Knop({
  variant = "secundair",
  className = "",
  children,
  ...props
}: { variant?: Variant } & ComponentProps<"button">) {
  return (
    <button className={`${basis} ${varianten[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Zelfde stijl, maar als navigatie-link. */
export function KnopLink({
  variant = "secundair",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${basis} ${varianten[variant]} ${className}`}>
      {children}
    </Link>
  );
}
