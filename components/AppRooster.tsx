import Link from "next/link";
import { navSecties } from "@/lib/navigatie";

/**
 * iPhone-stijl "home screen": vierkante widget-blokken per sectie, met de icoon
 * die we in de zijbalk ook gebruiken. Eén tik opent die sectie direct. Bron is
 * de navigatie (lib/navigatie), zodat nieuwe secties automatisch meekomen.
 */

// Levendige achtergrondkleuren voor de tegels — cyclisch toegewezen.
const KLEUREN = [
  "bg-navy",
  "bg-oranje",
  "bg-blue-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
  "bg-teal-600",
];

export function AppRooster() {
  // Alle nav-items behalve het dashboard zelf (daar sta je al).
  const items = navSecties.flatMap((s) => s.items).filter((i) => i.href !== "/");

  return (
    <section className="mb-8">
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6 lg:grid-cols-8">
        {items.map((item, i) => {
          const Icoon = item.icoon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex aspect-square w-full items-center justify-center rounded-[22%] text-white shadow-sm transition-transform group-active:scale-95 ${
                  KLEUREN[i % KLEUREN.length]
                }`}
              >
                <Icoon size={26} strokeWidth={1.75} />
              </span>
              <span className="line-clamp-1 w-full text-center text-[11px] font-medium text-navy/80">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
