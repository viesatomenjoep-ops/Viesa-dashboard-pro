"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Logt de gebruiker in met e-mail + wachtwoord.
 * Single-user: de eigenaar wordt aangemaakt in het Supabase-dashboard.
 */
export async function login(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      "/login?fout=" + encodeURIComponent("Onjuiste e-mail of wachtwoord."),
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Logt de gebruiker uit en stuurt terug naar de loginpagina. */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
