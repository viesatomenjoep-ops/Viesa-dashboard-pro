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
    redirect("/login?fout=" + encodeURIComponent(leesbareFout(error.message)));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Start "Log in met Google" (Supabase OAuth). Optioneel naast e-mail/wachtwoord.
 * Vereist dat de Google-provider in Supabase is ingeschakeld.
 */
export async function loginMetGoogle() {
  const supabase = createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site}/auth/callback` },
  });
  if (error || !data?.url) {
    redirect(
      "/login?fout=" +
        encodeURIComponent(
          error?.message ?? "Google-login niet beschikbaar (provider uit?).",
        ),
    );
  }
  redirect(data.url);
}

/** Vertaalt bekende Supabase-auth-fouten naar begrijpelijke NL-tekst. */
function leesbareFout(bericht: string): string {
  const b = bericht.toLowerCase();
  if (b.includes("email not confirmed")) {
    return "E-mail nog niet bevestigd. Bevestig de gebruiker in Supabase (Authentication → Users → Auto Confirm).";
  }
  if (b.includes("invalid login credentials")) {
    return "Onjuiste e-mail of wachtwoord.";
  }
  if (b.includes("email logins are disabled") || b.includes("provider")) {
    return "E-mail-login staat uit in Supabase (Authentication → Providers → Email).";
  }
  if (b.includes("fetch") || b.includes("network") || b.includes("failed to")) {
    return "Kan Supabase niet bereiken. Controleer NEXT_PUBLIC_SUPABASE_URL en de anon-key.";
  }
  // Onbekend: toon de originele reden zodat je precies ziet wat er speelt.
  return `Inloggen mislukt: ${bericht}`;
}

/** Logt de gebruiker uit en stuurt terug naar de loginpagina. */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
