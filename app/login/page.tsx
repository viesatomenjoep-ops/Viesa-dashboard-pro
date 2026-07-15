import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { login, loginMetGoogle } from "./actions";

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
            <div className="text-lg font-semibold text-navy">Viesa Automations</div>
            <div className="text-sm text-navy/60">Dashboard</div>
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

        {/* Optioneel: inloggen met Google (bijv. Viesa-Gmail) */}
        <div className="my-5 flex items-center gap-3 text-xs text-navy/40">
          <span className="h-px flex-1 bg-navy/10" />
          of
          <span className="h-px flex-1 bg-navy/10" />
        </div>
        <form action={loginMetGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.7 7l7.3 5.7c4.3-4 6.1-9.9 6.1-17.2z" />
              <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C.9 16.7 0 20.2 0 24s.9 7.3 2.6 10.4l7.8-6.1z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.3-5.7c-2 1.4-4.7 2.3-8 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Log in met Google
          </button>
        </form>
      </div>
    </main>
  );
}
