/** Centrale navigatie-configuratie voor de zijbalk. */
export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Leads & pipeline", href: "/leads" },
  { label: "Taken", href: "/taken" },
  { label: "Offertes", href: "/offertes" },
  { label: "Facturen", href: "/facturen" },
  { label: "Projecten", href: "/projecten" },
  { label: "Bestanden", href: "/bestanden" },
  { label: "Design-editor", href: "/design" },
  { label: "Whiteboard", href: "/whiteboard" },
  { label: "Koppelingen", href: "/koppelingen" },
];
