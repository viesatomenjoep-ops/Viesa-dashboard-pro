"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Markeert alle notificaties als gelezen. */
export async function markeerAllesGelezen() {
  const supabase = createClient();
  await supabase.from("notificaties").update({ gelezen: true }).eq("gelezen", false);
  revalidatePath("/notificaties");
  revalidatePath("/", "layout");
}

/** Markeert één notificatie als gelezen. */
export async function markeerGelezen(id: string) {
  const supabase = createClient();
  await supabase.from("notificaties").update({ gelezen: true }).eq("id", id);
  revalidatePath("/notificaties");
  revalidatePath("/", "layout");
}

/** Verwijdert een notificatie. */
export async function verwijderNotificatie(id: string) {
  const supabase = createClient();
  await supabase.from("notificaties").delete().eq("id", id);
  revalidatePath("/notificaties");
  revalidatePath("/", "layout");
}
