import { createBrowserClient } from "@supabase/ssr";

/**
 * Centrale Supabase-client voor client components ('use client').
 * Gebruikt uitsluitend de publieke anon-sleutel — nooit server-geheimen.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
