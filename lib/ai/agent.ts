import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Centrale agent-runner voor het Viesa Command Center.
 *
 * Eén plek waar élke AI-agent (bel-lijst, dagbriefing, verrijking, offerte, …)
 * doorheen loopt: praat met de Claude Messages API, meet tokens/duur, en logt
 * elke run in `ai_runs` (best-effort — faalt de log, dan gaat de agent gewoon
 * door). Principe: **agents stellen voor, de mens bevestigt.** Deze runner doet
 * dus nooit zelf schrijfacties op de data; dat blijft aan de aanroepende code
 * met expliciete bevestiging.
 */

const API = "https://api.anthropic.com/v1/messages";

type Usage = { input_tokens?: number; output_tokens?: number };

export type AgentUitkomst<T> = {
  ok: boolean;
  data: T | null; // gestructureerd (bij verwachtJson) of null
  tekst: string; // ruwe tekst van het model
  fout?: string;
  tokensIn: number;
  tokensUit: number;
  duurMs: number;
};

export async function draaiAgent<T = string>(opts: {
  /** Supabase-client (server of service) — voor het loggen in ai_runs. */
  supabase: SupabaseClient;
  /** Korte slug, bv. "bellijst". Verschijnt in ai_runs.agent. */
  agent: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  /** Verwacht een JSON-antwoord; de runner parseert en vult `data`. */
  verwachtJson?: boolean;
  /** Context die we bij de run loggen (invoer). */
  invoer?: unknown;
}): Promise<AgentUitkomst<T>> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-5";
  const start = Date.now();

  if (!key) {
    return {
      ok: false,
      data: null,
      tekst: "",
      fout: "ANTHROPIC_API_KEY ontbreekt.",
      tokensIn: 0,
      tokensUit: 0,
      duurMs: 0,
    };
  }

  let tekst = "";
  let usage: Usage = {};
  let fout: string | undefined;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1500,
        system: opts.system,
        messages: [{ role: "user", content: opts.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: Usage;
    };
    usage = data.usage ?? {};
    tekst = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n")
      .trim();
  } catch (e) {
    fout = e instanceof Error ? e.message : "Onbekende fout in agent.";
  }

  const duurMs = Date.now() - start;
  const tokensIn = usage.input_tokens ?? 0;
  const tokensUit = usage.output_tokens ?? 0;

  let data: T | null = null;
  if (!fout && opts.verwachtJson) {
    try {
      data = leesJson<T>(tekst);
    } catch (e) {
      fout = e instanceof Error ? e.message : "Kon JSON niet lezen.";
    }
  } else if (!fout) {
    data = tekst as unknown as T;
  }

  // Best-effort loggen — nooit de agent laten falen op de log.
  try {
    await opts.supabase.from("ai_runs").insert({
      agent: opts.agent,
      status: fout ? "mislukt" : "klaar",
      invoer: opts.invoer ?? null,
      uitvoer: data ?? (tekst ? { tekst } : null),
      model,
      tokens_in: tokensIn,
      tokens_uit: tokensUit,
      duur_ms: duurMs,
      fout: fout ?? null,
    });
  } catch {
    /* ai_runs bestaat mogelijk nog niet — negeren */
  }

  return { ok: !fout, data, tekst, fout, tokensIn, tokensUit, duurMs };
}

/** Haalt een JSON-object/array uit modeltekst, ook als het in ```json staat. */
export function leesJson<T>(tekst: string): T {
  const zonderFence = tekst
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  // Pak het eerste { … } of [ … ]-blok als er omheen gepraat wordt.
  const match = zonderFence.match(/[[{][\s\S]*[\]}]/);
  const bron = match ? match[0] : zonderFence;
  return JSON.parse(bron) as T;
}
