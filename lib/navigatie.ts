/** Gesecteerde navigatie voor de zijbalk. */
export type NavItem = { label: string; href: string };
export type NavSectie = { titel: string; items: NavItem[] };

export const navSecties: NavSectie[] = [
  {
    titel: "Overzicht",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Agenda", href: "/agenda" },
    ],
  },
  {
    titel: "Commercieel",
    items: [
      { label: "Klanten", href: "/klanten" },
      { label: "Leads & pipeline", href: "/leads" },
      { label: "Audits", href: "/audits" },
      { label: "Offertes", href: "/offertes" },
      { label: "Facturen", href: "/facturen" },
    ],
  },
  {
    titel: "Werk",
    items: [
      { label: "Projecten & notities", href: "/projecten" },
      { label: "Ideeën-whiteboard", href: "/whiteboard" },
    ],
  },
  {
    titel: "Bibliotheek",
    items: [
      { label: "Bestanden", href: "/bestanden" },
      { label: "Koppelingen", href: "/koppelingen" },
    ],
  },
];
