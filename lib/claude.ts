import "server-only";

/**
 * Dunne wrapper om de Claude Messages API (server-only; key in env).
 * Model instelbaar via CLAUDE_MODEL, standaard claude-sonnet-5.
 */
export async function claudeBericht(opts: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-5",
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });

  if (!res.ok) {
    const tekst = await res.text();
    throw new Error(`Claude API ${res.status}: ${tekst}`);
  }
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
}
