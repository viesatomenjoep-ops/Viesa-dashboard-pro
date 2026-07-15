/** Maakt van een willekeurige fout (incl. Supabase/PostgrestError-objecten)
 *  een leesbare string. Supabase-fouten zijn platte objecten met
 *  { message, details, hint, code } — geen echte Error-instances. */
export function leesFout(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const delen = [o.message, o.details, o.hint, o.code]
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    if (delen.length) return delen.join(" · ");
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}
