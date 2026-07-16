import { avatarKleur, initialen } from "@/lib/kleuren";

/**
 * Ronde avatar met initialen in een van de naam afgeleide kleur. Gebruikt in
 * klantenlijst, kanban, chat en maillijst. Puur decoratief (aria-hidden); de
 * naam staat als title voor de muisaanwijzer.
 */
export function Avatar({
  naam,
  size = 32,
  className = "",
}: {
  naam: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${avatarKleur(
        naam,
      )} ${className}`}
      title={naam}
      aria-hidden
    >
      {initialen(naam)}
    </span>
  );
}
