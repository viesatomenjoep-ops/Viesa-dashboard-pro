import { type ReactNode } from "react";

type Toon =
  | "navy"
  | "groen"
  | "oranje"
  | "grijs"
  | "rood"
  | "amber"
  | "blauw"
  | "paars";

const tonen: Record<Toon, string> = {
  navy: "bg-navy/10 text-navy",
  groen: "bg-emerald-100 text-emerald-800",
  oranje: "bg-oranje/10 text-oranje",
  grijs: "bg-navy/5 text-navy/60",
  rood: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  blauw: "bg-blue-100 text-blue-800",
  paars: "bg-purple-100 text-purple-800",
};

/** Compacte statuslabel. */
export function Badge({
  toon = "grijs",
  children,
}: {
  toon?: Toon;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tonen[toon]}`}
    >
      {children}
    </span>
  );
}
