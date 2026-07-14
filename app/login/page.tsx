import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { fout?: string };
}) {
  // Al ingelogd? Direct door naar het dashboard.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-navy/10 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight">
            <div className="text-lg font-semibold text-navy">Viesa</div>
            <div className="text-sm text-navy/60">Command Center</div>
          </div>
        </div>
        <p className="mt-1 text-sm text-navy/60">Log in om verder te gaan.</p>

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-navy"
            >
              E-mailadres
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy"
            >
              Wachtwoord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-navy/20 px-3 py-2 text-navy outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
          </div>

          {searchParams.fout && (
            <p
              role="alert"
              className="rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje"
            >
              {searchParams.fout}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-oranje/90"
          >
            Inloggen
          </button>
        </form>
      </div>
    </main>
  );
}
