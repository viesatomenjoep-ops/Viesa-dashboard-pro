import { type ReactNode } from "react";

/** Witte kaart met zachte schaduw en afgeronde hoeken (huisstijl). */
export function Kaart({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-navy/10 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
