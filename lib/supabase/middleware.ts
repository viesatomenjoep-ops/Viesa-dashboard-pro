import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Ververst de Supabase-sessie bij elke request en beschermt routes.
 * Niet-ingelogde bezoekers worden naar /login gestuurd (behalve /login zelf
 * en de /auth-routes).
 *
 * Volgt het aanbevolen @supabase/ssr-patroon voor Next.js middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Belangrijk: geen code tussen createServerClient en getUser(), anders kan de
  // sessie onverwacht uitloggen.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // /api-routes doen hun eigen authenticatie (gedeeld geheim / CRON_SECRET),
  // dus die niet naar /login omleiden.
  //
  // /rapport is het klantrapport: een buitenstaander opent dat met de
  // deelsleutel uit de URL. De toegang zit daar in de RLS-policy (migratie
  // 0048, anon mag alleen rijen lezen met een deelsleutel), niet in een
  // sessie — een klant heeft immers geen account.
  const isPubliek =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/rapport");

  if (!user && !isPubliek) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
