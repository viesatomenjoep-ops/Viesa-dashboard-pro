/** Gesecteerde navigatie voor de zijbalk. */
import {
  Globe,
  AlarmClock,
  Radar,
  Briefcase,
  Calendar,
  ClipboardCheck,
  FileText,
  Files,
  FileType,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Palette,
  Phone,
  ReceiptEuro,
  ScrollText,
  StickyNote,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icoon: LucideIcon };
export type NavSectie = { titel: string; items: NavItem[] };

export const navSecties: NavSectie[] = [
  {
    titel: "Overzicht",
    items: [
      { label: "Dashboard", href: "/dashboard", icoon: LayoutDashboard },
      { label: "Taken", href: "/taken", icoon: KanbanSquare },
      { label: "Agenda", href: "/agenda", icoon: Calendar },
      { label: "E-mail", href: "/mail", icoon: Mail },
    ],
  },
  {
    titel: "Commercieel",
    items: [
      { label: "Klanten", href: "/klanten", icoon: Users },
      { label: "Leads & pipeline", href: "/leads", icoon: Waypoints },
      { label: "Bellen", href: "/bellen", icoon: Phone },
      { label: "Follow-ups", href: "/followups", icoon: AlarmClock },
      { label: "AI Audit", href: "/audit", icoon: Radar },
      { label: "Audits", href: "/audits", icoon: ClipboardCheck },
      { label: "Websitescan", href: "/scan", icoon: Globe },
      { label: "Offertes", href: "/offertes", icoon: FileText },
      { label: "Facturen", href: "/facturen", icoon: ReceiptEuro },
      { label: "Sjablonen", href: "/sjablonen", icoon: FileType },
    ],
  },
  {
    titel: "Werk",
    items: [
      { label: "Projecten & notities", href: "/projecten", icoon: FolderOpen },
      { label: "Notulen", href: "/notulen", icoon: ScrollText },
      { label: "Ideeën-whiteboard", href: "/whiteboard", icoon: StickyNote },
      { label: "Portfolio", href: "/portfolio", icoon: Briefcase },
    ],
  },
  {
    titel: "Bibliotheek",
    items: [
      { label: "Bestanden", href: "/bestanden", icoon: Files },
      { label: "Overig", href: "/overig", icoon: LayoutGrid },
    ],
  },
  {
    titel: "AI & Content",
    items: [
      { label: "Brand Factory", href: "/brand-factory", icoon: Palette },
    ],
  },
];
