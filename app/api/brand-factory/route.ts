import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ fout: "Niet ingelogd" }, { status: 401 });

  const { data: merken } = await supabase
    .from("brand_factory_stats")
    .select("*")
    .order("naam");

  return NextResponse.json({ merken: merken || [] });
}
