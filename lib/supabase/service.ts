import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase-client met de service-role sleutel. Omzeilt RLS en mag
 * daarom UITSLUITEND server-side gebruikt worden (nooit in een client component).
 *
 * Gebruik dit alleen voor beheertaken die bewust boven RLS opereren.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
