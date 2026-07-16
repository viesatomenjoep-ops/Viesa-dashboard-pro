import { WidgetLauncher } from "@/components/WidgetLauncher";

export const dynamic = "force-dynamic";

/**
 * Startscherm (iPhone-home): het Viesa-logo + een rooster van widget-blokken.
 * Eén tik opent een sectie; "Dashboard" opent het welkomstscherm met to-do's.
 */
export default function HomePagina() {
  return <WidgetLauncher />;
}
