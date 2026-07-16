/** Gesecteerde navigatie voor de zijbalk. */
import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardCheck,
  FileText,
  Files,
  FileType,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  Link2,
  Mail,
  Receipt,
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
      { label: "Notificaties", href: "/notificaties", icoon: Bell },
    ],
  },
  {
    titel: "Commercieel",
    items: [
      { label: "Klanten", href: "/klanten", icoon: Users },
      { label: "Leads & pipeline", href: "/leads", icoon: Waypoints },
      { label: "Audits", href: "/audits", icoon: ClipboardCheck },
      { label: "Offertes", href: "/offertes", icoon: FileText },
      { label: "Facturen", href: "/facturen", icoon: Receipt },
      { label: "Sjablonen", href: "/sjablonen", icoon: FileType },
      { label: "Rapportage", href: "/rapportage", icoon: BarChart3 },
    ],
  },
  {
    titel: "Werk",
    items: [
      { label: "Projecten & notities", href: "/projecten", icoon: FolderOpen },
      { label: "Ideeën-whiteboard", href: "/whiteboard", icoon: StickyNote },
    ],
  },
  {
    titel: "Bibliotheek",
    items: [
      { label: "Bestanden", href: "/bestanden", icoon: Files },
      { label: "Koppelingen", href: "/koppelingen", icoon: Link2 },
    ],
  },
];
