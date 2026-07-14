import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Centrale Supabase-client voor server components, route handlers en
 * server actions. Gebruikt de anon-sleutel + RLS; leest de sessie uit cookies.
 *
 * Alle Supabase-calls in de app lopen via deze centrale client (of via
 * `createServiceClient` voor server-only admin-taken).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` kan falen vanuit een server component; de middleware
            // ververst dan de sessie. Veilig te negeren.
          }
        },
      },
    },
  );
}
